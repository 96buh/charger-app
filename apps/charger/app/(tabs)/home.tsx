import { View, StyleSheet, SafeAreaView, Text } from "react-native";
import { useState, useRef } from "react";
import Animated, { useSharedValue } from "react-native-reanimated";
import PagerView from "react-native-pager-view";

// contexts
import { useSettings } from "@/contexts/SettingsContext";
import { useBatteryData } from "@/contexts/BatteryDataContext";
import { useHardwareData } from "@/contexts/HardwareContext";

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

  const labelMap = {
    0: "正常",
    1: "線生鏽",
    2: "變壓器生鏽",
    3: "手機過熱",
    4: "線剝落",
    5: "線彎折",
  };

  const predicted =
    source === "local" ? battery.lstmResult : hardware.data?.predicted;
  const label =
    predicted !== undefined &&
    predicted !== null &&
    labelMap[predicted] !== undefined
      ? labelMap[predicted]
      : source === "local"
      ? "未知"
      : hardware.data?.label || "未知";
  const abnormal =
    predicted !== null && predicted !== undefined && predicted !== 0;

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

  const current_A = stats ? Math.abs(stats.current_mA) / 1000 : 0;
  const voltage_V = stats ? stats.voltage_mV / 1000 : 0;
  const temperature_C = stats?.temperature_C ?? 0;
  const power_W = current_A * voltage_V;

  const pageRef = useRef<PagerView>(null);
  const position = useSharedValue(0);
  const totalPages = 3;

  const onPageScroll = (event) => {
    position.value = event.nativeEvent.position + event.nativeEvent.offset;
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View
          style={{
            width: "100%",
            alignItems: "center",
            marginTop: 6,
            marginBottom: 4,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: abnormal ? "#e53935" : "#1b8f41",
              backgroundColor: abnormal ? "#ffebee" : "#e8f5e9",
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
        </AnimatedPagerView>
        {/* Pagination indicator */}
        <PaginationIndicator totalPages={totalPages} position={position} />
        <View style={styles.widgetsContainer}>
          <SquareWidget
            name="功率"
            value={power_W}
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
