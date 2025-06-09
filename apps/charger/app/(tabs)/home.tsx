import { View, StyleSheet, Text, SafeAreaView } from "react-native";
import { useState, useCallback, useRef } from "react";
import { Stack, Link, useFocusEffect } from "expo-router";
import PagerView from "react-native-pager-view";

// components and utils
import { SquareWidget } from "@/components/squareWidget";
import { LineChart } from "@/components/LineChart";
import { generateRandomDataPoint, type DataPoint } from "@/utils/data";
import Animated, { useSharedValue } from "react-native-reanimated";
import { PaginationIndicator } from "@/components/PaginationDots";

// constants
const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

export default function Index() {
  const [chartData, setChartData] = useState<DataPoint[]>(
    Array.from({ length: 31 }, (_, i) => generateRandomDataPoint(i)),
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
    }, []),
  );

  const pageRef = useRef<PagerView>(null);
  const position = useSharedValue(0);
  const totalPages = 3;

  const onPageScroll = (event) => {
    position.value = event.nativeEvent.position + event.nativeEvent.offset;
  };

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
            value={0}
            icon="power-plug-outline"
            unit="W"
          />
          <SquareWidget name="電流" value={0} icon="current-ac" unit="A" />
          <SquareWidget name="電壓" value={0} icon="lightning-bolt" unit="V" />
          <SquareWidget
            name="溫度"
            value={0}
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
