import { View, StyleSheet } from "react-native";
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
};

export function LineChart({ data, lineColor = "black" }: ChartComponentProps) {
  const font = useFont(inter, 12);
  const { state, isActive } = useChartPressState<{ highTmp: number }>({
    x: 0,
    y: { highTmp: 0 },
  });

  return (
    <View style={{ flex: 1, width: "95%" }}>
      <CartesianChart
        data={data}
        xKey="time"
        yKeys={["lowTmp", "highTmp"]}
        chartPressState={state}
        padding={20}
        domain={{ x: [0, 30] }}
        domainPadding={{ top: 30 }}
        axisOptions={{
          font,
        }}
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
    </View>
  );
}
