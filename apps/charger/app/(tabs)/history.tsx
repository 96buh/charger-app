import { StyleSheet, Text, View } from "react-native";
import { useBatteryLevel } from "expo-battery";

export default function Error() {
  const batteryLevel = useBatteryLevel();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>歷史異常紀錄</Text>
      <Text style={styles.text}>{batteryLevel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  text: {
    color: "black",
  },
});
