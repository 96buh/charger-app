import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  withSpring,
} from "react-native-reanimated";

type PaginationIndicatorProps = {
  totalPages: number;
  position: Animated.SharedValue<number>;
};

function Dot({
  index,
  position,
}: {
  index: number;
  position: Animated.SharedValue<number>;
}) {
  const animatedDotStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSpring(
          interpolate(
            position.value,
            [index - 1, index, index + 1],
            [1, 1.5, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }
          )
        ),
      },
    ],
    opacity: interpolate(
      position.value,
      [index - 1, index, index + 1],
      [0.5, 1, 0.5],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    ),
  }));
  return <Animated.View style={[styles.dot, animatedDotStyle]} />;
}

export function PaginationIndicator({
  totalPages,
  position,
}: PaginationIndicatorProps) {
  return (
    <View style={styles.paginationContainer}>
      {Array.from({ length: totalPages }).map((_, index) => (
        <Dot key={index} index={index} position={position} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 5,
    backgroundColor: "#EFEFEF",
    padding: 8,
    borderRadius: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: "#000",
    marginHorizontal: 5,
  },
});
