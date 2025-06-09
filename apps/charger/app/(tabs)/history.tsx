import { StyleSheet, Text, View } from "react-native";

export default function Error() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>歷史異常紀錄</Text>
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
