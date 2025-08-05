import { View, StyleSheet, Text } from "react-native";
import { useRef } from "react";
import Animated, { useSharedValue } from "react-native-reanimated";
import PagerView from "react-native-pager-view";
import { SafeAreaView } from "react-native-safe-area-context";

// contexts
import { useSettings } from "@/contexts/SettingsContext";
import { useBatteryData } from "@/contexts/BatteryDataContext";
import { useHardwareData } from "@/contexts/HardwareContext";
import { useAlert } from "@/contexts/AlertContext";

// components and utils
import { SquareWidget } from "@/components/squareWidget";
import { LineChart } from "@/components/LineChart";
import { PaginationIndicator } from "@/components/PaginationDots";

// constants
const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

/** 渲染home組件, 使用widget顯示充電訊息, 用PagerView放不同的圖表
 */
export default function Index() {
  const { source } = useSettings(); // local or esp32

  const battery = useBatteryData();
  const hardware = useHardwareData();
  const { abnormal, label } = useAlert();

  // 統一取得數據
  const stats = source === "local" ? battery.stats : hardware.data?.stats;
  const currentList =
    source === "local" ? battery.currentList : hardware.data?.currentList;
  const voltageList =
    source === "local" ? battery.voltageList : hardware.data?.voltageList;
  const powerList =
    source === "local" ? battery.powerList : hardware.data?.powerList;
  const temperatureList =
    source === "local"
      ? battery.temperatureList
      : hardware.data?.temperatureList;

  const error = source === "local" ? battery.error : hardware.error;

  // chart 數據格式
  const makeSeries = (arr) =>
    Array.isArray(arr)
      ? arr.map((val, idx) => ({
          time: idx,
          lowTmp: val,
          highTmp: val,
        }))
      : [];

  // 用 context 的資料
  const currentData = makeSeries(currentList);
  const voltageData = makeSeries(voltageList);
  const powerData = makeSeries(powerList);
  const temperatureData = makeSeries(temperatureList);

  const current_A = stats ? Math.abs(stats.current_mA) / 1000 : 0;
  const voltage_V = stats ? stats.voltage_mV / 1000 : 0;
  const temperature_C = stats?.temperature_C ?? 0;
  // const power_W = current_A * voltage_V;
  const power_W =
    powerList && powerList.length > 0 ? powerList[powerList.length - 1] : 0;

  const pageRef = useRef<PagerView>(null);
  const position = useSharedValue(0);
  const totalPages = 4;

  const onPageScroll = (event) => {
    position.value = event.nativeEvent.position + event.nativeEvent.offset;
  };

  const isUncharged = label === "未充電";
  const statusColor = isUncharged
    ? "#757575"
    : abnormal
    ? "#e53935"
    : "#1b8f41";
  const statusBg = isUncharged ? "#f5f5f5" : abnormal ? "#ffebee" : "#e8f5e9";

  return (
    <>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={{ alignItems: "center", marginVertical: 6 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "#5c6bc0" }}>
            即時訊息顯示
          </Text>
        </View>
        <View style={{ width: "100%", alignItems: "center" }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "bold",
              color: statusColor,
              backgroundColor: statusBg,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 3,
            }}
          >
            {abnormal ? `異常：${label}` : `狀態：${label}`}
          </Text>
        </View>
        <AnimatedPagerView
          style={styles.chartContainer}
          initialPage={0}
          onPageScroll={onPageScroll}
          ref={pageRef}
        >
          <View key="1" style={{ flex: 1 }}>
            <LineChart data={currentData} lineColor="red" />
          </View>
          <View key="2" style={{ flex: 1 }}>
            <LineChart data={voltageData} lineColor="darkgreen" />
          </View>
          <View key="3" style={{ flex: 1 }}>
            <LineChart data={powerData} lineColor="darkblue" />
          </View>
          <View key="4" style={{ flex: 1 }}>
            <LineChart data={temperatureData} lineColor="orange" />
          </View>
        </AnimatedPagerView>
        {/* Pagination indicator */}
        <PaginationIndicator totalPages={totalPages} position={position} />
        <View style={styles.widgetsContainer}>
          <SquareWidget
            name="功率"
            value={power_W.toFixed(2)}
            icon="power-plug-outline"
            unit="W"
          />
          <SquareWidget
            name="電流"
            value={current_A.toFixed(3)}
            icon="current-ac"
            unit="A"
          />

          <SquareWidget
            name="電壓"
            value={voltage_V.toFixed(2)}
            icon="lightning-bolt"
            unit="V"
          />
          <SquareWidget
            name="溫度"
            value={temperature_C.toFixed(1)}
            icon="power-plug-outline"
            unit="°C"
          />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  widgetsContainer: {
    padding: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  chartContainer: {
    height: "50%",
    width: "100%",
  },
});
