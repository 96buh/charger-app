import { Text, View, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

export function SquareWidget({
  name,
  value,
  icon,
  unit,
}: {
  name: string;
  value: number;
  icon: string;
  unit: string;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        {name !== "溫度" ? (
          <MaterialCommunityIcons name={icon} size={24} color="black" />
        ) : (
          <FontAwesome6 name="temperature-half" size={24} color="black" />
        )}
        <Text style={styles.headerName}>{name}</Text>
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.content}>
          {value}
          {unit}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "35%",
    height: "35%",
    backgroundColor: "#F2F2F7",
    padding: 15,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    marginHorizontal: 5,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerName: {
    marginLeft: 5,
    fontSize: 17,
    fontWeight: "bold",
  },
  contentContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  content: {
    fontSize: 17,
    fontWeight: "semibold",
  },
});
