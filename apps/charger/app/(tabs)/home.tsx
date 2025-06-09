import { View, StyleSheet, Text, SafeAreaView } from "react-native";
import { useState, useEffect, useCallback, useRef } from "react";
import Animated, { useSharedValue } from "react-native-reanimated";
import PagerView from "react-native-pager-view";
import { useFocusEffect } from "expo-router";
import { requireNativeModule } from "expo-modules-core";

// components and utils
import { SquareWidget } from "@/components/squareWidget";
import { LineChart } from "@/components/LineChart";
import { generateRandomDataPoint, type DataPoint } from "@/utils/data";
import { PaginationIndicator } from "@/components/PaginationDots";
import { type BatteryStats } from "@/utils/types";

// constants
const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);
const Battery = requireNativeModule("Mybattery");

const WINDOW_SEC = 30;
const SAMPLING_HZ = 1;

const pushFixed = (arr: DataPoint[], val: number): DataPoint[] => {
  const next = [...arr.slice(1), { time: 0, lowTmp: val, highTmp: val }];
  return next.map((p, idx) => ({ ...p, time: idx }));
};

const makeEmptySeries = (): DataPoint[] =>
  Array.from({ length: WINDOW_SEC + 1 }, (_, idx) => ({
    time: idx,
    lowTmp: 0,
    highTmp: 0,
  }));

/** 渲染home組件, 使用widget顯示充電訊息, 用PagerView放不同的圖表
 */
export default function Index() {
  // real data
  const [stats, setStats] = useState<BatteryStats | null>(null);
  const [currentData, setCurrent] = useState<DataPoint[]>(makeEmptySeries());
  const [voltageData, setVoltage] = useState<DataPoint[]>(makeEmptySeries());
  const [powerData, setPower] = useState<DataPoint[]>(makeEmptySeries());
  // useEffect(() => {
  //   async function fetchStats() {
  //     try {
  //       const s = await Battery.getStats();
  //       setStats(s);
  //     } catch (e) {
  //       console.warn("Battery module error:", e);
  //     }
  //   }
  //   fetchStats(); // 進畫面先抓一次
  //   const id = setInterval(fetchStats, 1000); // 1 Hz 更新
  //   return () => clearInterval(id);
  // }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const s = await Battery.getStats();
        setStats(s);

        const I_mA = Math.abs(s.current_mA);
        const V_V = s.voltage_mV / 1000;
        const P_W = (I_mA / 1000) * V_V;

        setCurrent((prev) => pushFixed(prev, I_mA));
        setVoltage((prev) => pushFixed(prev, V_V));
        setPower((prev) => pushFixed(prev, P_W));
      } catch (e) {
        console.warn("Battery module error:", e);
      }
    };

    fetchStats(); // 先抓一次
    const id = setInterval(fetchStats, 1000 / SAMPLING_HZ);
    return () => clearInterval(id);
  }, []);

  // fake data
  // const [chartData, setChartData] = useState<DataPoint[]>(
  //   Array.from({ length: 31 }, (_, i) => generateRandomDataPoint(i))
  // );
  // useFocusEffect(
  //   useCallback(() => {
  //     const interval = setInterval(() => {
  //       setChartData((prevData) => {
  //         const newData = [
  //           ...prevData.slice(1),
  //           generateRandomDataPoint(prevData.length - 1),
  //         ];
  //         return newData.map((item, index) => ({ ...item, time: index }));
  //       });
  //     }, 500);
  //
  //     return () => clearInterval(interval);
  //   }, [])
  // );

  const pageRef = useRef<PagerView>(null);
  const position = useSharedValue(0);
  const totalPages = 3;

  const onPageScroll = (event) => {
    position.value = event.nativeEvent.position + event.nativeEvent.offset;
  };

  /** 從stats得到電流，電壓，溫度
   */
  const current_mA = stats?.current_mA ?? 0;
  const voltage_V = stats ? stats.voltage_mV / 1000 : 0;
  const temperature_C = stats?.temperature_C ?? 0;
  const power_W = (Math.abs(current_mA) * voltage_V) / 1000; // 轉成 W

  return (
    <>
      <SafeAreaView style={styles.container}>
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
            value={current_mA}
            icon="current-ac"
            unit="mA"
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
