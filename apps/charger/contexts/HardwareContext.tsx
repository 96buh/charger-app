import React, { createContext, useContext, useState, useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";

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
});

export function HardwareDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { esp32Ip, esp32Port, esp32Path } = useSettings();
  const [data, setData] = useState<HardwareData>(defaultData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!esp32Ip) return;
    let timer: any;
    let aborted = false;

    const fetchData = async () => {
      setError(null);
      const url = `http://${esp32Ip.trim()}:${esp32Port || 8080}${
        esp32Path.startsWith("/") ? esp32Path : "/" + esp32Path
      }`;
      try {
        const res = await fetch(url, { timeout: 6000 });
        let json: any;
        try {
          json = await res.json();
        } catch {
          json = await res.text();
        }

        // --- 資料格式 mapping ---
        let sequence = Array.isArray(json.sequence) ? json.sequence : [];

        // stats 取最後一筆（如無就 null）
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
          currentList: sequence.map((s) => s.current ?? 0),
          voltageList: sequence.map((s) => s.voltage ?? 0),
          powerList: sequence.map((s) => s.power ?? 0),
          temperatureList: sequence.map((s) => s.temp_C ?? 0),
          label: json.label,
          predicted: json.predicted,
          timestamp: json.timestamp,
        };

        if (!aborted) setData(mapped);
        if (res.status >= 400 && !aborted) setError("伺服器錯誤或路徑不存在");
      } catch (err: any) {
        if (!aborted) setError("連線失敗：" + (err.message || err.toString()));
        if (!aborted) setData(defaultData);
      }
    };

    fetchData();
    timer = setInterval(fetchData, 2000);

    return () => {
      aborted = true;
      clearInterval(timer);
    };
  }, [esp32Ip, esp32Port, esp32Path]);

  return (
    <DataContext.Provider value={{ data, error }}>
      {children}
    </DataContext.Provider>
  );
}

export function useHardwareData() {
  return useContext(DataContext);
}
