import { showMessage } from "react-native-flash-message";
import { useSettings } from "@/contexts/SettingsContext";
import { useHardwareData } from "@/contexts/HardwareContext";
import {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  useCallback,
} from "react";
import { useAudioPlayer } from "expo-audio";
import * as Speech from "expo-speech";
import { useErrorLog } from "@/contexts/ErrorLogContext";
import i18n from "@/utils/i18n";
import { insertAlertRow } from "@/utils/supabaseAlerts";
import { isSupabaseConfigured } from "@/utils/supabaseClient";

const ALERT_SOUND = require("@/assets/sounds/alert.mp3");

const AlertContext = createContext();
const ALERT_REPEAT_INTERVAL_MS = 5 * 60 * 1000;

export function AlertProvider({ children }) {
  const { tempThreshold, language } = useSettings();
  i18n.locale = language;
  const { data: hardware, isCharging } = useHardwareData();
  const player = useAudioPlayer(ALERT_SOUND);
  const { addLog } = useErrorLog();

  const [abnormal, setAbnormal] = useState(false);
  const [label, setLabel] = useState("");
  const lastAbnormal = useRef(false);
  const lastLabel = useRef("");
  const lastLabelAlertTime = useRef<Record<string, number>>({});
  const timeoutRef = useRef(null);
  const prevCharging = useRef(isCharging);
  const lastSupabaseSignature = useRef<string | null>(null);

  const pushAlertToSupabase = useCallback(
    async (params: {
      predicted: number;
      timestamp?: string | number;
      sequence?: any[];
    }) => {
      if (!isSupabaseConfigured()) return;
      if (params.predicted === null || params.predicted === undefined) return;
      const normalizedTimestamp =
        typeof params.timestamp === "number" || typeof params.timestamp === "string"
          ? params.timestamp
          : Date.now();
      const signature = `${normalizedTimestamp}-${params.predicted}`;

      if (lastSupabaseSignature.current === signature) {
        return;
      }

      try {
        await insertAlertRow({
          predicted: params.predicted,
          timestamp: String(normalizedTimestamp),
          sequencer: params.sequence ?? [],
        });
        lastSupabaseSignature.current = signature;
      } catch (err) {
        console.warn("[Supabase] Failed to insert alert", err);
      }
    },
    []
  );

  // ========= 播報異常語音 ========
  const speakAlert = (text: string) => {
    Speech.stop();
    Speech.speak(i18n.t("abnormal", { label: text }), {
      language: language === "zh" ? "zh-TW" : "en-US",
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

  // ========== 溫度閾值通知 ==========
  const lastAlertedTemp = useRef(false);
  useEffect(() => {
    const temp = hardware?.stats?.temperature_C ?? null;
    if (temp !== null && tempThreshold !== null) {
      if (temp >= tempThreshold) {
        if (!lastAlertedTemp.current) {
          const tempText = i18n.t("tempOverThreshold", { temp: tempThreshold });
          showMessage({
            message: i18n.t("abnormal", { label: tempText }),
            type: "danger",
            icon: "auto",
            duration: 5000,
          });
          addLog({
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            reason: tempText,
            type: i18n.t("temperatureAbnormal"),
            reasonKey: "tempOverThreshold",
            reasonParams: {
              temp: tempThreshold,
              measuredTemp: temp,
            },
            typeKey: "temperatureAbnormal",
          });
          speakAlert(tempText);
          lastAlertedTemp.current = true;
        }
      } else {
        lastAlertedTemp.current = false;
      }
    }
  }, [hardware?.stats?.temperature_C, tempThreshold]);

  // ========== 一般異常判斷與通知 ==========
  useEffect(() => {
    if (prevCharging.current === false && isCharging === true) {
      lastAbnormal.current = false;
      lastLabel.current = "";
    }
    prevCharging.current = isCharging;

    // let predicted =
    //   source === "local" ? battery.lstmResult : hardware.data?.predicted;
    const predicted = hardware?.predicted;
    const labelMap = {
      0: "正常",
      1: "充電線生鏽",
      2: "變壓器生鏽",
      // 3: "變壓器過熱",
      // 4: "線剝落",
      // 5: "線彎折",
    } as Record<number, string>;

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
          : hardware?.label || "未知";
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
          : hardware?.label || "未知";
    }

    const labelKeyMap: Record<string, string> = {
      未充電: "notCharging",
      正常: "normal",
      未知: "unknown",
      充電線生鏽: "rustedCable",
      變壓器生鏽: "rustedTransformer",
      "Not Charging": "notCharging",
      Normal: "normal",
      Unknown: "unknown",
      "Cable Rust": "rustedCable",
      "Transformer Rust": "rustedTransformer",
    };
    const labelKey = labelKeyMap[labelNow];
    const displayLabel = labelKey ? i18n.t(labelKey) : labelNow;

    setAbnormal(abnormalNow);
    setLabel(labelNow);

    const lastAlertTime = lastLabelAlertTime.current[labelNow];
    const canRepeat =
      lastAlertTime !== undefined &&
      Date.now() - lastAlertTime >= ALERT_REPEAT_INTERVAL_MS;
    const shouldTriggerAlert =
      abnormalNow &&
      (lastAlertTime === undefined || canRepeat);

    if (shouldTriggerAlert) {
      showMessage({
        message: i18n.t("abnormal", { label: displayLabel }),
        type: "danger",
        icon: "auto",
        duration: 5000,
      });
      addLog({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        reason: displayLabel,
        type: displayLabel,
        reasonKey: labelKey,
        typeKey: labelKey,
      });
      player.play();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        player.pause();
        player.seekTo(0);
        speakAlert(displayLabel);
      }, 1000);

      void pushAlertToSupabase({
        predicted: predicted ?? 0,
        timestamp: hardware?.timestamp,
        sequence:
          hardware?.sequence ??
          hardware?.rawPayload?.sequence ??
          hardware?.rawPayload?.data ??
          [],
      });
      lastLabelAlertTime.current[labelNow] = Date.now();
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
    if (isCharging === false) {
      lastLabelAlertTime.current = {};
    }
    // eslint-disable-next-line
  }, [hardware?.predicted, isCharging]);

  return (
    <AlertContext.Provider value={{ abnormal, label, isCharging }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  return useContext(AlertContext);
}
