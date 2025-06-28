import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { requireNativeModule } from "expo-modules-core";
import { type BatteryStats } from "@/utils/types";
import * as ort from "onnxruntime-react-native";
import * as FileSystem from "expo-file-system";

const Battery = requireNativeModule("Mybattery");
const WINDOW_SEC = 30;
const SAMPLING_HZ = 1;
const SEQ_LEN = 10;

const MODEL_URL =
  "https://github.com/96buh/stuff/raw/refs/heads/main/lstm_model_3.onnx";
const MODEL_PATH = FileSystem.documentDirectory + "lstm_model_3.onnx";

/* 標準化參數 */
const MEAN = [1.04074985, 4.02928943, 35.13483291, 4.19241723];
const STD = [0.23643574, 0.16394218, 1.48206313, 0.95759648];

type BatteryDataContextProps = {
  stats: BatteryStats | null;
  currentList: number[];
  voltageList: number[];
  powerList: number[];
  temperatureList: number[];
  lstmResult: number | null;
};

const BatteryDataContext = createContext<BatteryDataContextProps | undefined>(
  undefined
);

export const BatteryDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [stats, setStats] = useState<BatteryStats | null>(null);

  const [currentList, setCurrentList] = useState<number[]>(
    Array(WINDOW_SEC).fill(0)
  );
  const [voltageList, setVoltageList] = useState<number[]>(
    Array(WINDOW_SEC).fill(0)
  );
  const [powerList, setPowerList] = useState<number[]>(
    Array(WINDOW_SEC).fill(0)
  );
  const [temperatureList, setTemperatureList] = useState<number[]>(
    Array(WINDOW_SEC).fill(0)
  );

  // 電池數據定時抓取
  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const s: BatteryStats = await Battery.getStats();
        if (!isMounted) return;
        setStats(s);

        const currentA = Math.abs(s.current_mA) / 1000;
        const voltageV = s.voltage_mV / 1000;
        const powerW = currentA * voltageV;
        const temperatureC = s.temperature_C;

        setCurrentList((prev) => [...prev.slice(1), currentA]);
        setVoltageList((prev) => [...prev.slice(1), voltageV]);
        setPowerList((prev) => [...prev.slice(1), powerW]);
        setTemperatureList((prev) => [...prev.slice(1), temperatureC]);
      } catch (e) {
        // 可以加錯誤 log
      }
    };
    fetchStats();
    const id = setInterval(fetchStats, 1000 / SAMPLING_HZ);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, []);

  // 機器學習模型推論
  const [lstmResult, setLstmResult] = useState<number | null>(null);
  const sessionRef = useRef<ort.InferenceSession | null>(null);

  // 下載並載入模型
  useEffect(() => {
    const initModel = async () => {
      try {
        const fileInfo = await FileSystem.getInfoAsync(MODEL_PATH);
        if (!fileInfo.exists) {
          console.log("下載模型...");
          await FileSystem.downloadAsync(MODEL_URL, MODEL_PATH);
          console.log("模型下載完成");
        } else {
          console.log("本地已有模型");
        }

        sessionRef.current = await ort.InferenceSession.create(MODEL_PATH);

        if (sessionRef.current) {
          console.log(
            "Model inputs:",
            sessionRef.current.inputNames,
            "outputs:",
            sessionRef.current.outputNames
          );
        }
      } catch (e) {
        console.log("模型載入失敗", e);
      }
    };
    initModel();
  }, []);

  // 資料每次有更新就推論
  useEffect(() => {
    const runLSTM = async () => {
      if (!sessionRef.current) return;

      const currentArr = currentList.slice(-SEQ_LEN);
      const voltageArr = voltageList.slice(-SEQ_LEN);
      const powerArr = powerList.slice(-SEQ_LEN);
      const tempArr = temperatureList.slice(-SEQ_LEN);

      if (
        currentArr.length < SEQ_LEN ||
        voltageArr.length < SEQ_LEN ||
        powerArr.length < SEQ_LEN ||
        tempArr.length < SEQ_LEN
      )
        return;

      // 正規化
      const inputArr = Array(SEQ_LEN)
        .fill(0)
        .map((_, i) => [
          (currentArr[i] - MEAN[0]) / STD[0],
          (voltageArr[i] - MEAN[1]) / STD[1],
          (tempArr[i] - MEAN[2]) / STD[2],
          (powerArr[i] - MEAN[3]) / STD[3],
        ]);

      const flat = inputArr.flat();

      try {
        const tensor = new ort.Tensor("float32", Float32Array.from(flat), [
          1,
          SEQ_LEN,
          4,
        ]);
        const feeds = {
          [sessionRef.current.inputNames[0]]: tensor,
        };

        const results = await sessionRef.current.run(feeds);
        const outputKey = sessionRef.current.outputNames[0];
        const output = results[outputKey].data;
        const predictedClass = output.indexOf(Math.max(...output)); // 找最大值的 index
        setLstmResult(predictedClass);
      } catch (e) {
        console.log("推論出錯", e);
      }
    };
    runLSTM();
  }, [currentList, voltageList, powerList, temperatureList]);

  return (
    <BatteryDataContext.Provider
      value={{
        stats,
        currentList,
        voltageList,
        powerList,
        temperatureList,
        lstmResult,
      }}
    >
      {children}
    </BatteryDataContext.Provider>
  );
};

export function useBatteryData() {
  const ctx = useContext(BatteryDataContext);
  if (ctx === undefined)
    throw new Error("useBatteryData 必須在 BatteryDataProvider 內部呼叫！");
  return ctx;
}
