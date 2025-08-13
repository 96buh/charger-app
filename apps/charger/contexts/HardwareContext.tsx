import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useSettings } from "@/contexts/SettingsContext";
import {
  useChargeHistory,
  type ChargeSession,
} from "@/contexts/ChargeHistoryContext";
import * as Battery from "expo-battery";

const WINDOW_SEC = 30;

type HardwareData = {
  stats: {
    current_mA: number;
    voltage_mV: number;
    temperature_C: number;
  } | null;
  currentList: number[];
  voltageList: number[];
  powerList: number[];
  temperatureList: number[];
  label?: string;
  predicted?: number;
  timestamp?: number;
};

type ContextType = {
  data: HardwareData;
  error: string | null;
  isCharging: boolean | null; // ← 新增，供頁面使用
};

const defaultData: HardwareData = {
  stats: null,
  currentList: [],
  voltageList: [],
  powerList: [],
  temperatureList: [],
  label: undefined,
  predicted: undefined,
  timestamp: undefined,
};

const DataContext = createContext<ContextType>({
  data: defaultData,
  error: null,
  isCharging: null,
});

export function HardwareDataProvider({ children }) {
  const { esp32Ip, esp32Port, esp32Path } = useSettings();
  const [error, setError] = useState<string | null>(null);

  // 充電狀態 (本 context 自己監控，不相依 AlertContext)
  const [isCharging, setIsCharging] = useState<boolean | null>(null);

  useEffect(() => {
    const subscription = Battery.addBatteryStateListener(({ batteryState }) => {
      setIsCharging(
        batteryState === Battery.BatteryState.CHARGING ||
          batteryState === Battery.BatteryState.FULL
      );
    });

    Battery.getBatteryStateAsync().then((batteryState) => {
      setIsCharging(
        batteryState === Battery.BatteryState.CHARGING ||
          batteryState === Battery.BatteryState.FULL
      );
    });

    return () => subscription.remove();
  }, []);

  // 用ref存最近30筆資料
  const currentRef = useRef<number[]>([]);
  const voltageRef = useRef<number[]>([]);
  const powerRef = useRef<number[]>([]);
  const temperatureRef = useRef<number[]>([]);
  const [data, setData] = useState<HardwareData>(defaultData);

  const { addSession } = useChargeHistory();
  const chargeStartLevel = useRef<number | null>(null);

  // ★★★ 充電狀態變化時清空資料 ★★★
  const prevCharging = useRef(isCharging);
  useEffect(() => {
    if (isCharging && !prevCharging.current) {
      // 開始充電時記錄電量
      Battery.getBatteryLevelAsync().then((level) => {
        chargeStartLevel.current = level;
      });
    }
    if (prevCharging.current && !isCharging) {
      // 結束充電時計算充電百分比並記錄
      Battery.getBatteryLevelAsync().then((level) => {
        const start = chargeStartLevel.current;
        if (start != null && level != null) {
          const diff = (level - start) * 100;
          if (diff > 0) {
            const session: ChargeSession = {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              percent: Number(diff.toFixed(2)),
            };
            addSession(session);
          }
        }
      });

      currentRef.current = [];
      voltageRef.current = [];
      powerRef.current = [];
      temperatureRef.current = [];
    }
    prevCharging.current = isCharging;
  }, [isCharging, addSession]);

  useEffect(() => {
    if (!esp32Ip) return;
    let timer: any;
    let aborted = false;

    const fetchData = async () => {
      setError(null);
      const url = `http://${esp32Ip.trim()}:${esp32Port || 8080}${
        esp32Path.startsWith("/") ? esp32Path : "/" + esp32Path
      }`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        let json: any;
        try {
          json = await res.json();
        } catch {
          json = await res.text();
        }
        let sequence = Array.isArray(json.sequence) ? json.sequence : [];

        // 取出新的一批
        const newCurrent = sequence.map((s) => s.current ?? 0);
        const newVoltage = sequence.map((s) => s.voltage ?? 0);
        const newPower = sequence.map((s) => s.power ?? 0);
        const newTemp = sequence.map((s) => s.temp_C ?? 0);

        // 更新ref，保留最近WINDOW_SEC筆
        currentRef.current = [...currentRef.current, ...newCurrent].slice(
          -WINDOW_SEC
        );
        voltageRef.current = [...voltageRef.current, ...newVoltage].slice(
          -WINDOW_SEC
        );
        powerRef.current = [...powerRef.current, ...newPower].slice(
          -WINDOW_SEC
        );
        temperatureRef.current = [...temperatureRef.current, ...newTemp].slice(
          -WINDOW_SEC
        );

        // stats 取最後一筆（最新）
        let last =
          sequence.length > 0 ? sequence[sequence.length - 1] : undefined;

        const mapped: HardwareData = {
          stats: last
            ? {
                current_mA: (last.current ?? 0) * 1000,
                voltage_mV: (last.voltage ?? 0) * 1000,
                temperature_C: last.temp_C ?? 0,
              }
            : null,
          currentList: [...currentRef.current],
          voltageList: [...voltageRef.current],
          powerList: [...powerRef.current],
          temperatureList: [...temperatureRef.current],
          label: json.label,
          predicted: json.predicted,
          timestamp: json.timestamp,
        };

        if (!aborted) setData(mapped);
        if (res.status >= 400 && !aborted) setError("伺服器錯誤或路徑不存在");
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (!aborted) {
          if (err.name === "AbortError") {
            setError("連線逾時");
          } else {
            setError("連線失敗：" + (err.message || err.toString()));
          }
          setData(defaultData);
        }

        // reset window if失敗
        currentRef.current = [];
        voltageRef.current = [];
        powerRef.current = [];
        temperatureRef.current = [];
      }
    };

    fetchData();
    timer = setInterval(fetchData, 10000);

    return () => {
      aborted = true;
      clearInterval(timer);
      // 你也可以清空ref
      currentRef.current = [];
      voltageRef.current = [];
      powerRef.current = [];
      temperatureRef.current = [];
    };
  }, [esp32Ip, esp32Port, esp32Path]);

  return (
    <DataContext.Provider value={{ data, error, isCharging }}>
      {children}
    </DataContext.Provider>
  );
}

export function useHardwareData() {
  return useContext(DataContext);
}
