import React from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { useSettings } from "@/contexts/SettingsContext";

export default function SettingsPage() {
  const {
    source,
    setSource,
    esp32Ip,
    setEsp32Ip,
    esp32Port,
    setEsp32Port,
    esp32Path,
    setEsp32Path,
  } = useSettings();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>資料來源</Text>
      <View style={styles.switchRow}>
        <Button
          title="本機"
          onPress={() => setSource("local")}
          color={source === "local" ? "#5c6bc0" : "#bbb"}
        />
        <Button
          title="ESP32"
          onPress={() => setSource("esp32")}
          color={source === "esp32" ? "#5c6bc0" : "#bbb"}
        />
      </View>

      {source === "esp32" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ESP32 伺服器設定</Text>
          <Text style={styles.label}>IP 地址</Text>
          <TextInput
            value={esp32Ip}
            onChangeText={setEsp32Ip}
            placeholder="例如 192.168.1.100"
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.label}>Port</Text>
          <TextInput
            value={esp32Port}
            onChangeText={setEsp32Port}
            placeholder="預設 8080"
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.label}>API 路徑</Text>
          <TextInput
            value={esp32Path}
            onChangeText={setEsp32Path}
            placeholder="/get_result"
            style={styles.input}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  section: {
    marginTop: 24,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 10,
    fontSize: 16,
  },
  label: {
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 6,
    padding: 8,
    backgroundColor: "#fff",
  },
});
