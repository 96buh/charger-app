import { View } from "react-native";
import { CartesianChart, Bar, useChartPressState } from "victory-native";
import { useFont } from "@shopify/react-native-skia";
import inter from "../assets/fonts/SpaceMono-Regular.ttf";
import { ToolTip } from "@/components/ToolTip";

export type BarDataPoint = {
  session: number;
  percent: number;
};

type BarChartProps = {
  data: BarDataPoint[];
  barColor?: string;
};

export function BarChart({ data, barColor = "black" }: BarChartProps) {
  const font = useFont(inter, 12);
  const { state, isActive } = useChartPressState<{ percent: number }>({
    x: 0,
    y: { percent: 0 },
  });

  return (
    <View style={{ flex: 1, width: "95%" }}>
      <CartesianChart
        data={data}
        xKey="session"
        yKeys={["percent"]}
        padding={20}
        chartPressState={state}
        domainPadding={{ top: 20, left: 20, right: 20 }}
        axisOptions={{ font }}
      >
        {({ points }) => (
          <>
            <Bar points={points.percent} color={barColor} />
            {isActive && (
              <ToolTip
                x={state.x.position}
                y={state.y.percent.position}
                color="black"
              />
            )}
          </>
        )}
      </CartesianChart>
    </View>
  );
}
