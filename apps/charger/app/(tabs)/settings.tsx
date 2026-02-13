import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Switch,
  ScrollView,
  Button,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Picker } from "@react-native-picker/picker";
import { useSettings } from "@/contexts/SettingsContext";
import { useChargeHistory } from "@/contexts/ChargeHistoryContext";
import { useErrorLog } from "@/contexts/ErrorLogContext";
import { generateDemoChargeHistory, generateDemoErrorLogs } from "@/utils/demoData";
import { SafeAreaView } from "react-native-safe-area-context";
import i18n from "@/utils/i18n";

export default function SettingsPage() {
  const {
    language,
    setLanguage,
    mqttHost,
    setMqttHost,
    mqttPort,
    setMqttPort,
    mqttPath,
    setMqttPath,
    mqttTopic,
    setMqttTopic,
    mqttPredictionTopic,
    setMqttPredictionTopic,
    mqttUsername,
    setMqttUsername,
    mqttPassword,
    setMqttPassword,
    mqttUseTls,
    setMqttUseTls,
    tempThreshold,
    setTempThreshold,
    notificationsEnabled,
    setNotificationsEnabled,
    chargeThreshold,
    setChargeThreshold,
  } = useSettings();

  const { replaceHistory, clearHistory } = useChargeHistory();
  const { replaceLogs } = useErrorLog();

  i18n.locale = language;

  const handleLoadDemo = () => {
    const now = Date.now();
    replaceHistory(generateDemoChargeHistory(now));
    replaceLogs(generateDemoErrorLogs(now));
  };

  const handleClearDemo = () => {
    clearHistory();
    replaceLogs([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t("mqttSettings")}</Text>
          <Text style={styles.label}>{i18n.t("brokerHost")}</Text>
          <TextInput
            value={mqttHost}
            onChangeText={setMqttHost}
            placeholder={i18n.t("exampleHostname")}
            style={styles.input}
            returnKeyType="next"
          />

          <Text style={styles.label}>{i18n.t("websocketPort")}</Text>
          <TextInput
            value={mqttPort}
            onChangeText={setMqttPort}
            placeholder={i18n.t("defaultMqttPort")}
            keyboardType="numeric"
            style={styles.input}
            returnKeyType="next"
          />

          <View style={styles.notifRow}>
            <Text style={styles.label}>{i18n.t("useTls")}</Text>
            <Switch value={mqttUseTls} onValueChange={setMqttUseTls} />
          </View>

          <Text style={styles.label}>{i18n.t("websocketPath")}</Text>
          <TextInput
            value={mqttPath}
            onChangeText={setMqttPath}
            placeholder="/mqtt"
            style={styles.input}
            autoCapitalize="none"
            returnKeyType="next"
          />

          <Text style={styles.label}>{i18n.t("mqttTopic")}</Text>
          <TextInput
            value={mqttTopic}
            onChangeText={setMqttTopic}
            placeholder={i18n.t("exampleTopic")}
            style={styles.input}
            autoCapitalize="none"
            returnKeyType="next"
          />

          <Text style={styles.label}>{i18n.t("mqttPredictionTopic")}</Text>
          <TextInput
            value={mqttPredictionTopic}
            onChangeText={setMqttPredictionTopic}
            placeholder={i18n.t("examplePredictionTopic")}
            style={styles.input}
            autoCapitalize="none"
            returnKeyType="next"
          />

          <Text style={styles.label}>{i18n.t("mqttUsername")}</Text>
          <TextInput
            value={mqttUsername}
            onChangeText={setMqttUsername}
            placeholder={i18n.t("optionalUsername")}
            style={styles.input}
            autoCapitalize="none"
            returnKeyType="next"
          />

          <Text style={styles.label}>{i18n.t("mqttPassword")}</Text>
          <TextInput
            value={mqttPassword}
            onChangeText={setMqttPassword}
            placeholder={i18n.t("optionalPassword")}
            style={styles.input}
            autoCapitalize="none"
            secureTextEntry
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t("demoData")}</Text>
          <Text style={styles.demoDescription}>
            {i18n.t("demoDataDescription")}
          </Text>
          <View style={styles.buttonRow}>
            <Button title={i18n.t("loadDemoData")} onPress={handleLoadDemo} />
          </View>
          <View style={styles.buttonRow}>
            <Button
              title={i18n.t("clearDemoData")}
              onPress={handleClearDemo}
              color="#e53935"
            />
          </View>
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
  buttonRow: {
    marginTop: 12,
  },
  demoDescription: {
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 20,
  },
});
