import { StyleSheet, Text, View, FlatList } from "react-native";
import { useBatteryData } from "@/contexts/BatteryDataContext";

export default function Error() {
  const labelMap = {
    0: "正常",
    1: "線生鏽",
    2: "變壓器生鏽",
    3: "手機過熱",
    4: "線剝落",
    5: "線彎折",
  };
  const {
    stats,
    currentList,
    voltageList,
    powerList,
    temperatureList,
    lstmResult,
  } = useBatteryData();

  return (
    <View style={styles.container}>
      <Text>最新電流：{currentList[currentList.length - 1]?.toFixed(3)} A</Text>
      <Text>最新電壓：{voltageList[voltageList.length - 1]?.toFixed(2)} V</Text>
      <Text>最新功率：{powerList[powerList.length - 1]?.toFixed(2)} W</Text>
      <Text>
        最新溫度：{temperatureList[temperatureList.length - 1]?.toFixed(1)} °C
      </Text>
      <Text>
        模型分類結果：{lstmResult}（{labelMap[lstmResult ?? 0]})
      </Text>
      {/* ---------- */}
      <View style={{ gap: 8, padding: 8 }}>
        <Text>最近10秒數據：</Text>
        {[
          { label: "電流", data: currentList.slice(-10), digits: 2 },
          { label: "電壓", data: voltageList.slice(-10), digits: 2 },
          { label: "功率", data: powerList.slice(-10), digits: 2 },
          { label: "溫度", data: temperatureList.slice(-10), digits: 1 },
        ].map((row, idx) => (
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
                  width: 38, // 固定每個格子的寬度，數字才不會被壓縮
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
  text: {
    color: "black",
  },
});
