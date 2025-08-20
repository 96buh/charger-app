import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Switch,
  ScrollView,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Picker } from "@react-native-picker/picker";
import { useSettings } from "@/contexts/SettingsContext";
import { SafeAreaView } from "react-native-safe-area-context";
import i18n from "@/utils/i18n";

export default function SettingsPage() {
  const {
    language,
    setLanguage,
    esp32Ip,
    setEsp32Ip,
    esp32Port,
    setEsp32Port,
    esp32Path,
    setEsp32Path,
    tempThreshold,
    setTempThreshold,
    notificationsEnabled,
    setNotificationsEnabled,
    chargeThreshold,
    setChargeThreshold,
  } = useSettings();

  i18n.locale = language;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t("esp32Settings")}</Text>
          <Text style={styles.label}>{i18n.t("ipAddress")}</Text>
          <TextInput
            value={esp32Ip}
            onChangeText={setEsp32Ip}
            placeholder={i18n.t("exampleIp")}
            keyboardType="numeric"
            style={styles.input}
            returnKeyType="next"
          />

          <Text style={styles.label}>{i18n.t("port")}</Text>
          <TextInput
            value={esp32Port}
            onChangeText={setEsp32Port}
            placeholder={i18n.t("defaultPort")}
            keyboardType="numeric"
            style={styles.input}
            returnKeyType="next"
          />

          <Text style={styles.label}>{i18n.t("apiPath")}</Text>
          <TextInput
            value={esp32Path}
            onChangeText={setEsp32Path}
            placeholder="/get_result"
            style={styles.input}
            autoCapitalize="none"
            returnKeyType="done"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {i18n.t("tempThreshold", { tempThreshold })}
          </Text>
          <Slider
            minimumValue={30}
            maximumValue={70}
            step={1}
            value={tempThreshold}
            onValueChange={setTempThreshold}
          />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t("notifications")}</Text>
          <View style={styles.notifRow}>
            <Text style={styles.label}>{i18n.t("enableNotifications")}</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
          </View>
          <Text style={styles.sectionTitle}>
            {i18n.t("chargeThreshold", {
              chargeThreshold: Math.round(chargeThreshold * 100),
            })}
          </Text>
          <Slider
            minimumValue={0.5}
            maximumValue={1}
            step={0.01}
            value={chargeThreshold}
            onValueChange={setChargeThreshold}
          />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t("language")}</Text>
          <Picker selectedValue={language} onValueChange={setLanguage}>
            <Picker.Item label={i18n.t("english") as string} value="en" />
            <Picker.Item label={i18n.t("chinese") as string} value="zh" />
          </Picker>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  section: {
    marginTop: 30,
    padding: 16,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    elevation: 1,
  },
  notifRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
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
