import { showMessage } from "react-native-flash-message";
import { useSettings } from "@/contexts/SettingsContext";
import { useBatteryData } from "@/contexts/BatteryDataContext";
import { useHardwareData } from "@/contexts/HardwareContext";
import { useEffect, useRef, useState, createContext, useContext } from "react";

const AlertContext = createContext();

export function AlertProvider({ children }) {
  const { source } = useSettings();
  const battery = useBatteryData();
  const hardware = useHardwareData();

  const [abnormal, setAbnormal] = useState(false);
  const [label, setLabel] = useState("");
  const lastAbnormal = useRef(false);

  useEffect(() => {
    let predicted =
      source === "local" ? battery.lstmResult : hardware.data?.predicted;
    let labelMap = {
      0: "正常",
      1: "線生鏽",
      2: "變壓器生鏽",
      3: "手機過熱",
      4: "線剝落",
      5: "線彎折",
    };
    let abnormalNow =
      predicted !== null && predicted !== undefined && predicted !== 0;
    let labelNow =
      predicted !== undefined && labelMap[predicted] !== undefined
        ? labelMap[predicted]
        : source === "local"
        ? "未知"
        : hardware.data?.label || "未知";

    setAbnormal(abnormalNow);
    setLabel(labelNow);

    // 只有狀態剛從正常變異常時才 showMessage
    if (abnormalNow && !lastAbnormal.current) {
      showMessage({
        message: `異常：${labelNow}`,
        type: "danger",
        icon: "auto",
        duration: 5000,
      });
    }
    lastAbnormal.current = abnormalNow;
  }, [battery.lstmResult, hardware.data?.predicted, source]);

  return (
    <AlertContext.Provider value={{ abnormal, label }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  return useContext(AlertContext);
}
