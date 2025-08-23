import React from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  nowMs: number;
  offsetDays: number;
  onShift: (d: number) => void;
  onReset: () => void;
  labelToday?: string;
};

export default function DevClockControls({
  nowMs,
  offsetDays,
  onShift,
  onReset,
  labelToday = "Today",
}: Props) {
  return (
    <View style={{ alignItems: "center", marginBottom: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 12 }}>
        <Pressable onPress={() => onShift(-1)} accessibilityRole="button">
          <Text style={{ color: "#4f46e5" }}>← -1d</Text>
        </Pressable>
        <Pressable onPress={onReset} accessibilityRole="button">
          <Text style={{ color: "#4f46e5" }}>{labelToday}</Text>
        </Pressable>
        <Pressable onPress={() => onShift(1)} accessibilityRole="button">
          <Text style={{ color: "#4f46e5" }}>+1d →</Text>
        </Pressable>
      </View>
      <Text style={{ textAlign: "center", color: "#6b7280", marginTop: 6 }}>
        Dev clock: {new Date(nowMs).toLocaleString()} (
        {offsetDays >= 0 ? "+" : ""}
        {offsetDays}d)
      </Text>
    </View>
  );
}
