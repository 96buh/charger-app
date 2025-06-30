import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useSettings } from "@/contexts/SettingsContext";
import { SafeAreaView } from "react-native-safe-area-context";

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
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>資料來源</Text>
      <View style={styles.switchRow}>
        <TouchableOpacity
          style={[
            styles.switchBtn,
            source === "local" && styles.switchBtnActive,
          ]}
          onPress={() => setSource("local")}
        >
          <Text
            style={[
              styles.switchText,
              source === "local" && styles.switchTextActive,
            ]}
          >
            本機
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.switchBtn,
            source === "esp32" && styles.switchBtnActive,
          ]}
          onPress={() => setSource("esp32")}
        >
          <Text
            style={[
              styles.switchText,
              source === "esp32" && styles.switchTextActive,
            ]}
          >
            ESP32
          </Text>
        </TouchableOpacity>
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
            returnKeyType="next"
          />

          <Text style={styles.label}>Port</Text>
          <TextInput
            value={esp32Port}
            onChangeText={setEsp32Port}
            placeholder="預設 8080"
            keyboardType="numeric"
            style={styles.input}
            returnKeyType="next"
          />

          <Text style={styles.label}>API 路徑</Text>
          <TextInput
            value={esp32Path}
            onChangeText={setEsp32Path}
            placeholder="/get_result"
            style={styles.input}
            autoCapitalize="none"
            returnKeyType="done"
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 10,
    letterSpacing: 1,
    color: "#222b55",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    gap: 16,
  },
  switchBtn: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 10,
    backgroundColor: "#ececec",
    elevation: 2,
  },
  switchBtnActive: {
    backgroundColor: "#5c6bc0",
  },
  switchText: {
    fontSize: 16,
    color: "#888",
    fontWeight: "bold",
    letterSpacing: 1,
  },
  switchTextActive: {
    color: "#fff",
  },
  section: {
    marginTop: 30,
    padding: 16,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    elevation: 1,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 12,
    fontSize: 17,
    color: "#444",
  },
  label: {
    marginTop: 10,
    marginBottom: 4,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#fff",
    fontSize: 15,
  },
});
