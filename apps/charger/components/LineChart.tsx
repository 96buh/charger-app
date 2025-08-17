import { View, Text, StyleSheet } from "react-native";
import { CartesianChart, Line, useChartPressState } from "victory-native";
import { ToolTip } from "@/components/ToolTip";
import { useFont } from "@shopify/react-native-skia";
import inter from "../assets/fonts/SpaceMono-Regular.ttf";

type DataPoint = {
  time: number;
  lowTmp: number;
  highTmp: number;
};

type ChartComponentProps = {
  data: DataPoint[];
  lineColor?: string;
  label?: string;
  yDomain?: [number, number];
  compactTitle?: boolean;

  legendAlign?: "start" | "center" | "end"; // 置左/中/右（outside & inside 都適用）
  legendPlacement?: "outside" | "inside"; // outside: 圖表上方（預設） / inside: 覆蓋在圖內
};

export function LineChart({
  data,
  lineColor = "black",
  label,
  yDomain,
  compactTitle = true,

  legendAlign = "center",
  legendPlacement = "outside",
}: ChartComponentProps) {
  const font = useFont(inter, 12);
  const { state, isActive } = useChartPressState<{ highTmp: number }>({
    x: 0,
    y: { highTmp: 0 },
  });

  const domain = yDomain ? { x: [0, 30], y: yDomain } : { x: [0, 30] };

  const justifyMap: Record<
    "start" | "center" | "end",
    "flex-start" | "center" | "flex-end"
  > = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
  };

  return (
    <View style={styles.container}>
      {label && legendPlacement === "outside" && (
        <View
          style={[styles.titleRow, { justifyContent: justifyMap[legendAlign] }]}
        >
          <View style={[styles.dot, { backgroundColor: lineColor }]} />
          <Text
            style={[styles.titleText, compactTitle && styles.titleTextCompact]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      )}

      <View style={styles.chartWrap}>
        <CartesianChart
          data={data}
          xKey="time"
          yKeys={["lowTmp", "highTmp"]}
          chartPressState={state}
          padding={20}
          domain={domain}
          domainPadding={{ top: 30 }}
          axisOptions={{ font }}
        >
          {({ points }) => (
            <>
              <Line points={points.highTmp} color={lineColor} strokeWidth={2} />
              {isActive && (
                <ToolTip
                  x={state.x.position}
                  y={state.y.highTmp.position}
                  color="black"
                />
              )}
            </>
          )}
        </CartesianChart>

        {label && legendPlacement === "inside" && (
          <View
            pointerEvents="none"
            style={[
              styles.legendOverlay,
              { alignItems: justifyMap[legendAlign] as any }, // 水平對齊
            ]}
          >
            <View style={styles.legendPill}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: lineColor, marginRight: 6 },
                ]}
              />
              <Text style={styles.legendPillText} numberOfLines={1}>
                {label}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: "100%" },

  // outside 標題列
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginRight: 6,
  },
  titleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  titleTextCompact: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6b7280",
  },

  // chart container，用來放 inside legend
  chartWrap: {
    flex: 1,
    position: "relative",
  },

  // inside legend：預設置中且靠上
  legendOverlay: {
    position: "absolute",
    top: 4,
    left: 0,
    right: 0,
  },
  legendPill: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
  },
  legendPillText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },
});
