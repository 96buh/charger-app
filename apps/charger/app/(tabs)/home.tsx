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

/** 渲染home組件, 使用widget顯示充電訊息, 用PagerView放不同的圖表
 */
export default function Index() {
  // real data
  const [stats, setStats] = useState<BatteryStats | null>(null);
  useEffect(() => {
    async function fetchStats() {
      try {
        const s = await Battery.getStats();
        setStats(s);
      } catch (e) {
        console.warn("Battery module error:", e);
      }
    }
    fetchStats(); // 進畫面先抓一次
    const id = setInterval(fetchStats, 1000); // 1 Hz 更新
    return () => clearInterval(id);
  }, []);

  // fake data
  const [chartData, setChartData] = useState<DataPoint[]>(
    Array.from({ length: 31 }, (_, i) => generateRandomDataPoint(i))
  );
  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => {
        setChartData((prevData) => {
          const newData = [
            ...prevData.slice(1),
            generateRandomDataPoint(prevData.length - 1),
          ];
          return newData.map((item, index) => ({ ...item, time: index }));
        });
      }, 500);

      return () => clearInterval(interval);
    }, [])
  );

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
            <LineChart data={chartData} lineColor="red" />
          </View>
          <View key="2" style={{ flex: 1 }}>
            <LineChart data={chartData} lineColor="darkgreen" />
          </View>
          <View key="3" style={{ flex: 1 }}>
            <LineChart data={chartData} lineColor="darkblue" />
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
