import { View, Text } from "react-native";
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
};

export function LineChart({
  data,
  lineColor = "black",
  label,
  yDomain,
}: ChartComponentProps) {
  const font = useFont(inter, 12);
  const { state, isActive } = useChartPressState<{ highTmp: number }>({
    x: 0,
    y: { highTmp: 0 },
  });

  const domain = yDomain ? { x: [0, 30], y: yDomain } : { x: [0, 30] };

  return (
    <View style={{ flex: 1, width: "95%" }}>
      {label && (
        <Text
          style={{
            fontSize: 16,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 4,
          }}
        >
          {label}
        </Text>
      )}
      <CartesianChart
        data={data}
        xKey="time"
        yKeys={["lowTmp", "highTmp"]}
        chartPressState={state}
        padding={20}
        domain={domain}
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
