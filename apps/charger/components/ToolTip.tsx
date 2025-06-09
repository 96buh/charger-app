import { Circle } from "@shopify/react-native-skia";
import type { SharedValue } from "react-native-reanimated";

export function ToolTip({
  x,
  y,
  color,
}: {
  x: SharedValue<number>;
  y: SharedValue<number>;
  color: string;
}) {
  return <Circle cx={x} cy={y} r={4} color={color} />;
}
