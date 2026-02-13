import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const defaultLang =
    Localization.getLocales()[0]?.languageCode === "zh" ? "zh" : "en";
  const [language, setLanguage] = useState(defaultLang);
  const [mqttHost, setMqttHost] = useState(
    "41d94ebb0f8e4a538cec6b931a1c2c27.s1.eu.hivemq.cloud"
  );
  const [mqttPort, setMqttPort] = useState("8884");
  const [mqttPath, setMqttPath] = useState("/mqtt");
  const [mqttTopic, setMqttTopic] = useState("");
  const [mqttPredictionTopic, setMqttPredictionTopic] = useState("");
  const [mqttUsername, setMqttUsername] = useState("NUTNee");
  const [mqttPassword, setMqttPassword] = useState("NUTNee1234");
  const [mqttUseTls, setMqttUseTls] = useState(true);
  const [tempThreshold, setTempThreshold] = useState(40);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [chargeThreshold, setChargeThreshold] = useState(0.9);

  // 自動載入與保存設定到本地
  useEffect(() => {
    AsyncStorage.getItem("app_settings").then((raw) => {
      if (raw) {
        const s = JSON.parse(raw);
        if (s.mqttHost !== undefined) setMqttHost(s.mqttHost);
        else if (s.esp32Ip) setMqttHost(s.esp32Ip);
        if (s.mqttPort !== undefined) setMqttPort(s.mqttPort);
        else if (s.esp32Port) setMqttPort(s.esp32Port);
        if (s.mqttPath !== undefined) setMqttPath(s.mqttPath);
        if (s.mqttTopic !== undefined) {
          setMqttTopic(s.mqttTopic);
        } else if (s.esp32Path) {
          setMqttTopic(s.esp32Path.replace(/^\//, ""));
        }
        if (s.mqttPredictionTopic !== undefined)
          setMqttPredictionTopic(s.mqttPredictionTopic);
        if (s.mqttUsername !== undefined) setMqttUsername(s.mqttUsername);
        if (s.mqttPassword !== undefined) setMqttPassword(s.mqttPassword);
        if (s.mqttUseTls !== undefined) setMqttUseTls(s.mqttUseTls);
        if (s.tempThreshold !== undefined) setTempThreshold(s.tempThreshold);
        if (s.notificationsEnabled !== undefined)
          setNotificationsEnabled(s.notificationsEnabled);
        if (s.chargeThreshold !== undefined)
          setChargeThreshold(s.chargeThreshold);
        if (s.language) setLanguage(s.language);
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(
      "app_settings",
      JSON.stringify({
        language,
        mqttHost,
        mqttPort,
        mqttPath,
        mqttTopic,
        mqttPredictionTopic,
        mqttUsername,
        mqttPassword,
        mqttUseTls,
        tempThreshold,
        notificationsEnabled,
        chargeThreshold,
      })
    );
  }, [
    language,
    mqttHost,
    mqttPort,
    mqttPath,
    mqttTopic,
    mqttPredictionTopic,
    mqttUsername,
    mqttPassword,
    mqttUseTls,
    tempThreshold,
    notificationsEnabled,
    chargeThreshold,
  ]);

  return (
    <SettingsContext.Provider
      value={{
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
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
