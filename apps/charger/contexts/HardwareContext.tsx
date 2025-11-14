import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Client } from "paho-mqtt";
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
  sequence?: any[];
  rawPayload?: Record<string, any>;
};

type ContextType = {
  data: HardwareData;
  error: string | null;
  isCharging: boolean | null; // ← 新增，供頁面使用
  activeSession: {
    startTimeMs: number;
    startPercent: number;
    livePercent: number; // 已補電百分點（0-100）
    liveDurationMin: number;
  } | null;
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
  sequence: undefined,
  rawPayload: undefined,
};

const DataContext = createContext<ContextType>({
  data: defaultData,
  error: null,
  isCharging: null,
  activeSession: null,
});

export function HardwareDataProvider({ children }) {
  const {
    mqttHost,
    mqttPort,
    mqttPath,
    mqttTopic,
    mqttUsername,
    mqttPassword,
    mqttUseTls,
  } = useSettings();
  const [error, setError] = useState<string | null>(null);

  // 充電狀態 (本 context 自己監控，不相依 AlertContext)
  const [isCharging, setIsCharging] = useState<boolean | null>(null);
  const batteryLevelRef = useRef<number | null>(null);
  const [activeSession, setActiveSession] = useState<ContextType["activeSession"]>(
    null
  );

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

  useEffect(() => {
    const updateLevel = (level: number | null) => {
      if (level != null) {
        batteryLevelRef.current = level;
        // 更新即時充電資訊
        if (
          isCharging &&
          chargeStartLevel.current != null &&
          chargeStartTime.current != null
        ) {
          const diff = (level - chargeStartLevel.current) * 100;
          const durationMin = (Date.now() - chargeStartTime.current) / 60000;
          setActiveSession({
            startTimeMs: chargeStartTime.current,
            startPercent: Number((chargeStartLevel.current * 100).toFixed(2)),
            livePercent: Math.max(0, Number(diff.toFixed(2))),
            liveDurationMin: Number(durationMin.toFixed(2)),
          });
        }
      }
    };

    Battery.getBatteryLevelAsync().then(updateLevel);
    const levelSub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      updateLevel(batteryLevel);
    });

    return () => levelSub.remove();
  }, [isCharging]);

  const refreshBatteryLevel = useCallback(async () => {
    try {
      const latest = await Battery.getBatteryLevelAsync();
      if (typeof latest === "number" && Number.isFinite(latest)) {
        batteryLevelRef.current = latest;
        return latest;
      }
    } catch (err) {
      console.warn("Failed to refresh battery level", err);
    }
    return batteryLevelRef.current;
  }, []);

  // 用ref存最近30筆資料
  const currentRef = useRef<number[]>([]);
  const voltageRef = useRef<number[]>([]);
  const powerRef = useRef<number[]>([]);
  const temperatureRef = useRef<number[]>([]);
  const [data, setData] = useState<HardwareData>(defaultData);

  const { addSession } = useChargeHistory();
  const chargeStartLevel = useRef<number | null>(null);
  const chargeStartTime = useRef<number | null>(null);

  // ★★★ 充電狀態變化時清空資料 ★★★
  const prevCharging = useRef(isCharging);
  useEffect(() => {
    if (isCharging && !prevCharging.current) {
      // 開始充電時記錄電量
      chargeStartTime.current = Date.now();
      refreshBatteryLevel().then((level) => {
        chargeStartLevel.current = level ?? batteryLevelRef.current;
        if (
          chargeStartLevel.current != null &&
          chargeStartTime.current != null
        ) {
          setActiveSession({
            startTimeMs: chargeStartTime.current,
            startPercent: Number((chargeStartLevel.current * 100).toFixed(2)),
            livePercent: 0,
            liveDurationMin: 0,
          });
        }
      });
    }
    if (prevCharging.current && !isCharging) {
      // 結束充電時計算充電百分比並記錄
      refreshBatteryLevel().then((latestLevel) => {
        const level =
          latestLevel ?? batteryLevelRef.current ?? chargeStartLevel.current;
        const startLevel = chargeStartLevel.current;
        const startTime = chargeStartTime.current;
        if (startLevel != null && level != null && startTime != null) {
          const diff = (level - startLevel) * 100;
          const durationMin = (Date.now() - startTime) / 60000;
          const session: ChargeSession = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            percent: Math.max(0, Number(diff.toFixed(2))),
            durationMin: Number(durationMin.toFixed(2)),
            startPercent: Number((startLevel * 100).toFixed(2)),
            endPercent: Number((level * 100).toFixed(2)),
          };
          addSession(session);
        }

        currentRef.current = [];
        voltageRef.current = [];
        powerRef.current = [];
        temperatureRef.current = [];
        chargeStartLevel.current = null;
        chargeStartTime.current = null;
        setActiveSession(null);
      });
    }
    prevCharging.current = isCharging;
  }, [isCharging, addSession, refreshBatteryLevel]);

  useEffect(() => {
    const host = mqttHost?.trim();
    const topic = mqttTopic?.trim();
    if (!host || !topic) {
      setError(null);
      setData(defaultData);
      currentRef.current = [];
      voltageRef.current = [];
      powerRef.current = [];
      temperatureRef.current = [];
      return;
    }

    const scheme = mqttUseTls ? "wss" : "ws";
    const sanitizedHost = host.replace(/^wss?:\/\//i, "").replace(/\/+$/, "");
    const portNumber = Number(mqttPort?.trim()) || (mqttUseTls ? 8884 : 8083);
    const pathRaw = mqttPath?.trim() ?? "";
    const normalizedPath = pathRaw
      ? pathRaw.startsWith("/")
        ? pathRaw
        : `/${pathRaw}`
      : "";
    const clientId = `charger-${Math.random().toString(16).slice(2, 10)}`;
    const decoder =
      typeof TextDecoder !== "undefined" ? new TextDecoder() : null;
    setError(null);

    let stopped = false;
    let client: Client | null = null;

    const resetBuffers = () => {
      currentRef.current = [];
      voltageRef.current = [];
      powerRef.current = [];
      temperatureRef.current = [];
    };

    const handleSequence = (sequence: any[], root: any) => {
      const newCurrent = sequence.map((s) => s.current ?? s.current_A ?? 0);
      const newVoltage = sequence.map((s) => s.voltage ?? s.voltage_V ?? 0);
      const newPower = sequence.map((s) => s.power ?? s.power_W ?? 0);
      const newTemp = sequence.map((s) => s.temp_C ?? s.temperature_C ?? 0);

      currentRef.current = [...currentRef.current, ...newCurrent].slice(
        -WINDOW_SEC
      );
      voltageRef.current = [...voltageRef.current, ...newVoltage].slice(
        -WINDOW_SEC
      );
      powerRef.current = [...powerRef.current, ...newPower].slice(-WINDOW_SEC);
      temperatureRef.current = [
        ...temperatureRef.current,
        ...newTemp,
      ].slice(-WINDOW_SEC);

      const lastSample =
        sequence.length > 0 ? sequence[sequence.length - 1] : undefined;

      const mapped: HardwareData = {
        stats: lastSample
          ? {
              current_mA: (lastSample.current ?? 0) * 1000,
              voltage_mV: (lastSample.voltage ?? 0) * 1000,
              temperature_C: lastSample.temp_C ?? 0,
            }
          : null,
        currentList: [...currentRef.current],
        voltageList: [...voltageRef.current],
        powerList: [...powerRef.current],
        temperatureList: [...temperatureRef.current],
        label: root?.label ?? lastSample?.label,
        predicted: root?.predicted ?? lastSample?.predicted,
        timestamp: root?.timestamp ?? lastSample?.timestamp ?? Date.now(),
        sequence: [...sequence],
        rawPayload: root,
      };
      setError(null);
      setData(mapped);
    };

    const handlePayload = (raw: any) => {
      if (!raw || typeof raw !== "object") return;
      let sequence: any[] = [];
      if (Array.isArray(raw)) {
        sequence = raw;
      } else if (Array.isArray(raw.sequence)) {
        sequence = raw.sequence;
      } else if (Array.isArray(raw.data)) {
        sequence = raw.data;
      } else if (
        raw.current !== undefined ||
        raw.voltage !== undefined ||
        raw.power !== undefined ||
        raw.temp_C !== undefined
      ) {
        sequence = [raw];
      }

      if (sequence.length === 0) return;
      handleSequence(sequence, raw);
    };

    const payloadToString = (
      message: string | ArrayBuffer | ArrayBufferView | null
    ) => {
      if (!message) return "";
      if (typeof message === "string") return message;
      if (decoder) {
        if (message instanceof ArrayBuffer) {
          return decoder.decode(new Uint8Array(message));
        }
        if (ArrayBuffer.isView(message)) {
          return decoder.decode(message as ArrayBufferView);
        }
      }
      return "";
    };

    const handleConnectionLost = (responseObject: any) => {
      if (stopped) return;
      const reason = responseObject?.errorMessage || "未知錯誤";
      setError(`MQTT 已斷線：${reason}`);
      resetBuffers();
      setData(defaultData);
    };

    const handleMessageArrived = (mqttMessage: any) => {
      if (stopped) return;
      try {
        const text = payloadToString(mqttMessage?.payloadString ?? mqttMessage?.payloadBytes);
        if (!text) return;
        const json = JSON.parse(text);
        handlePayload(json);
      } catch (err: any) {
        setError(`資料解析失敗：${err?.message || String(err)}`);
      }
    };

    const connectClient = () => {
      try {
        const uri = `${scheme}://${sanitizedHost}:${portNumber}${
          normalizedPath || "/mqtt"
        }`;
        client = new Client(uri, clientId);
      } catch (err: any) {
        setError("建立 MQTT Client 失敗：" + (err?.message || String(err)));
        return;
      }

      client.onConnectionLost = handleConnectionLost;
      client.onMessageArrived = handleMessageArrived;

      client.connect({
        useSSL: mqttUseTls,
        userName: mqttUsername?.trim() ?? "",
        password: mqttPassword ?? "",
        timeout: 10,
        keepAliveInterval: 45,
        onSuccess: () => {
          if (stopped) return;
          setError(null);
          try {
            client?.subscribe(topic, { qos: 1 });
          } catch (err: any) {
            setError(`訂閱失敗：${err?.message || String(err)}`);
          }
        },
        onFailure: (error) => {
          if (stopped) return;
          const reason = error?.errorMessage || "未知錯誤";
          setError(`MQTT 連線失敗：${reason}`);
          setData(defaultData);
          resetBuffers();
        },
      });
    };

    connectClient();

    return () => {
      stopped = true;
      resetBuffers();
      if (client && client.isConnected()) {
        try {
          client.disconnect();
        } catch {
          // ignore disconnect errors
        }
      }
    };
  }, [
    mqttHost,
    mqttPort,
    mqttPath,
    mqttTopic,
    mqttUsername,
    mqttPassword,
    mqttUseTls,
  ]);

  return (
    <DataContext.Provider value={{ data, error, isCharging, activeSession }}>
      {children}
    </DataContext.Provider>
  );
}

export function useHardwareData() {
  return useContext(DataContext);
}
