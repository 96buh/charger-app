import { StyleSheet, Text, View, ScrollView } from "react-native";
import { useSettings } from "@/contexts/SettingsContext";
import { useBatteryData } from "@/contexts/BatteryDataContext";
import { useHardwareData } from "@/contexts/HardwareContext";

export default function ErrorPage() {
  const { source } = useSettings();

  const labelMap = {
    0: "正常",
    1: "線生鏽",
    2: "變壓器生鏽",
    3: "手機過熱",
    4: "線剝落",
    5: "線彎折",
  };

  // 拿本機或esp32的資料
  const battery = useBatteryData();
  const { data: hardwareData, error } = useHardwareData();

  // 統一取值
  const isLocal = source === "local";
  const stats = isLocal ? battery.stats : hardwareData?.stats;
  const currentList = isLocal ? battery.currentList : hardwareData?.currentList;
  const voltageList = isLocal ? battery.voltageList : hardwareData?.voltageList;
  const powerList = isLocal ? battery.powerList : hardwareData?.powerList;
  const temperatureList = isLocal
    ? battery.temperatureList
    : hardwareData?.temperatureList;

  // 統一分類
  let predicted = isLocal ? battery.lstmResult : hardwareData?.predicted;
  let label =
    predicted !== undefined && labelMap[predicted] !== undefined
      ? labelMap[predicted]
      : isLocal
      ? "未知"
      : hardwareData?.label || "未知";

  // 顯示異常狀態
  const abnormal =
    predicted !== null && predicted !== undefined && predicted !== 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text
        style={{
          color: abnormal ? "red" : "green",
          fontWeight: "bold",
          fontSize: 20,
          marginBottom: 8,
        }}
      >
        {abnormal ? `異常：${label}` : `狀態：${label}`}
      </Text>
      <Text>
        最新電流：{currentList?.[currentList.length - 1]?.toFixed(3) ?? "無"} A
      </Text>
      <Text>
        最新電壓：{voltageList?.[voltageList.length - 1]?.toFixed(2) ?? "無"} V
      </Text>
      <Text>
        最新功率：{powerList?.[powerList.length - 1]?.toFixed(2) ?? "無"} W
      </Text>
      <Text>
        最新溫度：
        {temperatureList?.[temperatureList.length - 1]?.toFixed(1) ?? "無"} °C
      </Text>

      <View style={{ gap: 8, padding: 8 }}>
        <Text style={{ fontWeight: "bold" }}>最近10秒數據：</Text>
        {[
          { label: "電流", data: currentList?.slice(-10) ?? [], digits: 2 },
          { label: "電壓", data: voltageList?.slice(-10) ?? [], digits: 2 },
          { label: "功率", data: powerList?.slice(-10) ?? [], digits: 2 },
          { label: "溫度", data: temperatureList?.slice(-10) ?? [], digits: 1 },
        ].map((row) => (
          <View
            key={row.label}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 4,
              flexWrap: "wrap",
            }}
          >
            <Text style={{ width: 40, fontWeight: "bold", fontSize: 16 }}>
              {row.label}
            </Text>
            {row.data.map((v, i) => (
              <View
                key={i}
                style={{
                  width: 38,
                  alignItems: "center",
                  marginHorizontal: 2,
                }}
              >
                <Text style={{ fontSize: 15 }}>{v.toFixed(row.digits)}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
      {/* 如果有錯誤提示 */}
      {error && <Text style={{ color: "red" }}>{error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "white",
  },
});
