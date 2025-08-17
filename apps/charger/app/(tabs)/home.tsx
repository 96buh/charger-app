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

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

const THEME = {
  primary: "#4f46e5",
  text: "#111827",
  muted: "#6b7280",
  success: "#1b8f41",
  danger: "#e53935",
  warningBg: "#ffebee",
  successBg: "#e8f5e9",
  neutralBg: "#f5f5f5",
  radius: 12,
};

/** 渲染home組件, 使用widget顯示充電訊息, 用PagerView放不同的圖表 */
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

  // chart 數據格式
  const makeSeries = (arr: number[] | undefined) =>
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
  const power_W =
    powerList && powerList.length > 0 ? powerList[powerList.length - 1] : 0;

  const pageRef = useRef<PagerView>(null);
  const position = useSharedValue(0);
  const totalPages = 4;

  const onPageScroll = (event: any) => {
    position.value = event.nativeEvent.position + event.nativeEvent.offset;
  };

  const isUncharged = label === "未充電";
  const statusColor = isUncharged
    ? THEME.muted
    : abnormal
    ? THEME.danger
    : THEME.success;
  const statusBg = isUncharged
    ? THEME.neutralBg
    : abnormal
    ? THEME.warningBg
    : THEME.successBg;

  return (
    <>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.headerWrap}>
          <Text style={styles.headerTitle}>即時訊息顯示</Text>
        </View>

        <View style={styles.statusRow}>
          <Text
            style={[
              styles.statusPill,
              { color: statusColor, backgroundColor: statusBg },
            ]}
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
            <LineChart
              data={currentData}
              lineColor="#ef4444"
              label="電流 (A)"
              yDomain={[0, 2]}
            />
          </View>
          <View key="2" style={{ flex: 1 }}>
            <LineChart
              data={voltageData}
              lineColor="#16a34a"
              label="電壓 (V)"
              yDomain={[0, 5]}
            />
          </View>
          <View key="3" style={{ flex: 1 }}>
            <LineChart
              data={powerData}
              lineColor="#1d4ed8"
              label="功率 (W)"
              yDomain={[0, 10]}
            />
          </View>
          <View key="4" style={{ flex: 1 }}>
            <LineChart
              data={temperatureData}
              lineColor="#f59e0b"
              label="溫度 (°C)"
              yDomain={[0, 60]}
            />
          </View>
        </AnimatedPagerView>

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
            icon="thermometer"
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
  headerWrap: {
    alignItems: "center",
    marginTop: 6,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#5c6bc0",
    letterSpacing: 0.2,
  },
  statusRow: { width: "100%", alignItems: "center" },
  statusPill: {
    fontSize: 13,
    fontWeight: "600",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chartContainer: {
    height: "50%",
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  widgetsContainer: {
    padding: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignSelf: "stretch",
  },
});
