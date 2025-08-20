import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const defaultLang =
    Localization.getLocales()[0]?.languageCode === "zh" ? "zh" : "en";
  const [language, setLanguage] = useState(defaultLang);
  const [esp32Ip, setEsp32Ip] = useState("");
  const [esp32Port, setEsp32Port] = useState("8080");
  const [esp32Path, setEsp32Path] = useState("/get_result");
  const [tempThreshold, setTempThreshold] = useState(40);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [chargeThreshold, setChargeThreshold] = useState(0.9);

  // 自動載入與保存設定到本地
  useEffect(() => {
    AsyncStorage.getItem("app_settings").then((raw) => {
      if (raw) {
        const s = JSON.parse(raw);
        if (s.esp32Ip) setEsp32Ip(s.esp32Ip);
        if (s.esp32Port) setEsp32Port(s.esp32Port);
        if (s.esp32Path) setEsp32Path(s.esp32Path);
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
        esp32Ip,
        esp32Port,
        esp32Path,
        tempThreshold,
        notificationsEnabled,
        chargeThreshold,
      })
    );
  }, [
    language,
    esp32Ip,
    esp32Port,
    esp32Path,
    tempThreshold,
    notificationsEnabled,
    chargeThreshold,
  ]);

  return (
    <SettingsContext.Provider
      value={{
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
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
