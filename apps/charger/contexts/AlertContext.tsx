import { showMessage } from "react-native-flash-message";
import { useSettings } from "@/contexts/SettingsContext";
import { useBatteryData } from "@/contexts/BatteryDataContext";
import { useHardwareData } from "@/contexts/HardwareContext";
import { useEffect, useRef, useState, createContext, useContext } from "react";
import * as Battery from "expo-battery";
import { useAudioPlayer } from "expo-audio";
import * as Speech from "expo-speech";

const ALERT_SOUND = require("@/assets/sounds/alert.mp3");

const AlertContext = createContext();

export function AlertProvider({ children }) {
  const { source } = useSettings();
  const battery = useBatteryData();
  const hardware = useHardwareData();
  const player = useAudioPlayer(ALERT_SOUND);

  const [isCharging, setIsCharging] = useState(null);
  const [abnormal, setAbnormal] = useState(false);
  const [label, setLabel] = useState("");
  const lastAbnormal = useRef(false);
  const lastLabel = useRef("");
  const timeoutRef = useRef(null);
  const prevCharging = useRef(isCharging);

  // ============ 監聽手機充電狀態 ============
  useEffect(() => {
    const subscription = Battery.addBatteryStateListener(({ batteryState }) => {
      setIsCharging(
        batteryState === Battery.BatteryState.CHARGING ||
          batteryState === Battery.BatteryState.FULL
      );
    });

    Battery.getBatteryStateAsync().then((batteryState) => {
      setIsCharging(
        batteryState === Battery.BatteryState.CHARGING ||
          batteryState === Battery.BatteryState.FULL
      );
    });

    return () => subscription.remove();
  }, []);

  // ========= 播報異常語音 ========
  const speakAlert = (text) => {
    Speech.stop();
    Speech.speak("異常：" + text, {
      language: "zh-TW",
      rate: 1.0,
      pitch: 1.1,
    });
  };

  // ========== 充電狀態重設異常紀錄 ==========
  useEffect(() => {
    if (prevCharging.current === false && isCharging === true) {
      lastAbnormal.current = false;
      lastLabel.current = "";
    }
    prevCharging.current = isCharging;
  }, [isCharging]);

  // ========== 溫度區間異常語音 ==========
  const lastAlertedTemp = useRef(null);
  useEffect(() => {
    const tempThresholds = [35, 40, 45, 50];
    const temp = hardware.data?.stats?.temperature_C ?? null;

    // 找到目前所處的最高溫度區間
    let highestReached = null;
    if (temp !== null) {
      for (let i = tempThresholds.length - 1; i >= 0; i--) {
        if (temp >= tempThresholds[i]) {
          highestReached = tempThresholds[i];
          break;
        }
      }
    }

    // 若進入新區間才播報，且不會再唸低區間
    if (highestReached !== null && lastAlertedTemp.current !== highestReached) {
      showMessage({
        message: `充電異常：變壓器溫度超過${highestReached}度`,
        type: "danger",
        icon: "auto",
        duration: 5000,
      });
      speakAlert(`變壓器溫度超過${highestReached}度`);
      lastAlertedTemp.current = highestReached;
    }

    // 溫度下降到最低區間以下，重設
    if (temp !== null && temp < tempThresholds[0]) {
      lastAlertedTemp.current = null;
    }
  }, [hardware.data?.stats?.temperature_C, isCharging]);

  // ========== 一般異常判斷與通知 ==========
  useEffect(() => {
    if (prevCharging.current === false && isCharging === true) {
      lastAbnormal.current = false;
      lastLabel.current = "";
    }
    prevCharging.current = isCharging;

    let predicted =
      source === "local" ? battery.lstmResult : hardware.data?.predicted;
    let labelMap = {
      0: "正常",
      1: "充電線生鏽",
      2: "變壓器生鏽",
      // 3: "變壓器過熱",
      // 4: "線剝落",
      // 5: "線彎折",
    };

    let abnormalNow = false;
    let labelNow = "";

    if (isCharging === false) {
      abnormalNow = false;
      labelNow = "未充電";
      lastAbnormal.current = false;
      lastLabel.current = "";
    } else if (
      predicted !== null &&
      predicted !== undefined &&
      predicted !== 0
    ) {
      abnormalNow = true;
      labelNow =
        predicted !== undefined && labelMap[predicted] !== undefined
          ? labelMap[predicted]
          : source === "local"
          ? "未知"
          : hardware.data?.label || "未知";
      // ★★★ 忽略「變壓器過熱」這個異常（只用溫度區間語音處理溫度）★★★
      if (labelNow === "變壓器過熱") {
        abnormalNow = false;
        labelNow = "正常";
      }
    } else {
      abnormalNow = false;
      labelNow =
        predicted !== undefined && labelMap[predicted] !== undefined
          ? labelMap[predicted]
          : source === "local"
          ? "未知"
          : hardware.data?.label || "未知";
    }

    setAbnormal(abnormalNow);
    setLabel(labelNow);

    if (
      abnormalNow &&
      (!lastAbnormal.current || labelNow !== lastLabel.current)
    ) {
      showMessage({
        message: `異常：${labelNow}`,
        type: "danger",
        icon: "auto",
        duration: 5000,
      });
      player.play();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        player.pause();
        player.seekTo(0);
        speakAlert(labelNow);
      }, 1000);
    }

    // ---------- 3. 恢復正常或未充電，關閉通知 ----------
    if ((!abnormalNow || isCharging === false) && lastAbnormal.current) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      player.pause();
      player.seekTo(0);
      Speech.stop();
    }

    lastAbnormal.current = abnormalNow;
    lastLabel.current = labelNow;
    // eslint-disable-next-line
  }, [battery.lstmResult, hardware.data?.predicted, source, isCharging]);

  return (
    <AlertContext.Provider value={{ abnormal, label, isCharging }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  return useContext(AlertContext);
}
