import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import { requireNativeModule } from "expo-modules-core";

import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import { type BatteryStats, type Sample } from "@/utils/types";

const Battery = requireNativeModule("Mybattery");

export default function Error() {
  const [stats, setStats] = useState<BatteryStats | null>(null);
  const [record, setRecord] = useState(false); // 錄製state
  const [elapsed, setElapsed] = useState(0); // 錄製秒數
  const startRef = useRef<number | null>(null); // 起始時間
  const samples = useRef<Sample[]>([]); // 累積資料
  const timerId = useRef<NodeJS.Timer | null>(null); // 動態取樣器

  const fetchStats = async () => {
    try {
      const raw = await Battery.getStats();
      const power_W = (raw.current_mA / 1000) * (raw.voltage_mV / 1000); // 轉 A、V
      const s: BatteryStats = { ...raw, power_W };
      setStats(s);

      if (record) {
        samples.current.push({
          t: new Date().toLocaleTimeString("en-GB", { hour12: false }), // 24h
          current: s.current_mA,
          voltage: s.voltage_mV,
          temp: s.temperature_C,
          power: s.power_W,
        });
        if (startRef.current !== null) {
          const sec = Math.floor((Date.now() - startRef.current) / 1000);
          setElapsed(sec);
        }
      }
    } catch (e) {
      console.warn("Battery module error:", e);
    }
  };

  // 切換錄製狀態
  const toggleRecord = async () => {
    if (record) {
      // 目前正在錄 → 按下後停止
      setRecord(false);
      timerId.current && clearInterval(timerId.current);
      await exportCsv();
      samples.current = [];
      startRef.current = null; // **歸零計時器**
      setElapsed(0);
    } else {
      // 目前停止 → 按下後開始
      samples.current = [];
      setRecord(true);
      startRef.current = Date.now(); // **記錄開始時間**
      setElapsed(0);
      fetchStats(); // 立即抓第一筆
      timerId.current = setInterval(fetchStats, 100); // 10 Hz
    }
  };

  /** 將 samples 寫成 CSV → 分享 */
  const exportCsv = async () => {
    if (samples.current.length === 0) return;

    const header = "time,current_mA,voltage_mV,temp_C,power_W\n";
    const rows = samples.current
      .map((r) => `${r.t},${r.current},${r.voltage},${r.temp},${r.power}`)
      .join("\n");
    const csv = header + rows;

    const uri = FileSystem.documentDirectory + "battery_log.csv";
    await FileSystem.writeAsStringAsync(uri, csv, { encoding: "utf8" });
    await Sharing.shareAsync(uri);
  };

  /** 每秒更新畫面用的低頻 interval */
  useEffect(() => {
    fetchStats(); // 畫面至少 1 Hz
    const id = setInterval(fetchStats, 1000);
    return () => clearInterval(id);
  }, [record]);

  // 充電數據顯示
  const current = stats ? Math.abs(stats.current_mA).toFixed(0) + " mA" : "--";
  const voltage = stats ? (stats.voltage_mV / 1000).toFixed(3) + " V" : "--";
  const temp = stats ? stats.temperature_C.toFixed(1) + " °C" : "--";
  const power = stats ? stats.power_W.toFixed(2) + " W" : "--"; // **新增**

  return (
    <View style={styles.container}>
      <Text style={styles.title}>即時電池資訊</Text>
      <Info
        label="電流"
        value={current}
        hint={stats && (stats.current_mA < 0 ? "充電" : "放電")}
      />
      <Info label="電壓" value={voltage} />
      <Info label="功率" value={power} />
      <Info label="溫度" value={temp} />

      {record && <Text style={styles.timer}>{`已錄製 ${elapsed} 秒`}</Text>}
      <Button
        title={record ? "停止並匯出" : "開始錄製"}
        onPress={toggleRecord}
        color={record ? "firebrick" : "seagreen"}
      />
    </View>
  );
}

function Info({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <View style={{ alignItems: "center", marginVertical: 4 }}>
      <Text style={styles.subtitle}>
        {label}
        {hint && <Text style={styles.hint}>（{hint}）</Text>}
      </Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  title: { fontSize: 22, marginBottom: 12, color: "black" },
  subtitle: { fontSize: 16, color: "gray" },
  value: { fontSize: 28, fontWeight: "bold", color: "black" },
  hint: { fontSize: 14, color: "gray" },
});
