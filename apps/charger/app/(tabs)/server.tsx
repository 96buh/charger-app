import {
  View,
  TextInput,
  Button,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useState } from "react";

export default function Server() {
  // 預設主機 IP 與 API 路徑
  const [ip, setIp] = useState("10.0.2.2");
  const [apiPath, setApiPath] = useState("/get_result");
  const [result, setResult] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);

  function fetchWithTimeout(resource, options = {}) {
    const { timeout = 8000 } = options; // 8 秒預設 timeout
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    return fetch(resource, { ...options, signal: controller.signal }).finally(
      () => clearTimeout(id)
    );
  }

  const fetchResult = async () => {
    setFetching(true);
    setError(null);
    setResult(null);
    try {
      let path = apiPath.trim();
      if (!path.startsWith("/")) path = "/" + path;
      const url = `http://${ip.trim()}:8080${path}`;
      const res = await fetchWithTimeout(url, { timeout: 6000 }); // 6 秒 timeout
      let data;
      try {
        data = await res.json();
      } catch (e) {
        data = await res.text();
      }
      setResult(data);
      if (res.status >= 400) setError("伺服器錯誤或路徑不存在");
    } catch (err) {
      setResult(null);
      // 捕捉 abort 的錯誤
      if (err.name === "AbortError") {
        setError("連線超時，請檢查 IP 是否正確");
      } else {
        setError("連線失敗：" + (err.message || err.toString()));
      }
    } finally {
      setFetching(false);
    }
  };

  // 輔助：轉換 timestamp
  const timeStr = (timestamp) => {
    if (!timestamp) return "";
    try {
      return new Date(timestamp * 1000).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const isObject = (val) =>
    val && typeof val === "object" && !Array.isArray(val);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>API 測試</Text>
      <Text style={styles.label}>伺服器 IP（如 10.0.2.2 / 192.168.1.100）</Text>
      <TextInput
        value={ip}
        onChangeText={setIp}
        style={styles.input}
        keyboardType="numbers-and-punctuation"
        placeholder="輸入 IP 位址"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.label}>API 路徑（如 /get_result, /hello, ...）</Text>
      <TextInput
        value={apiPath}
        onChangeText={setApiPath}
        style={styles.input}
        placeholder="輸入 API 路徑"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Button
        title={fetching ? "載入中..." : "取得結果"}
        onPress={fetchResult}
        disabled={fetching}
      />

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : result ? (
        <View style={{ marginTop: 20 }}>
          {/* 智慧判斷內容格式 */}
          {isObject(result) && result.sequence ? (
            <>
              <Text style={{ fontSize: 16 }}>
                推論分類：{result.label}（{result.predicted}）
              </Text>
              <Text style={{ color: "#888" }}>
                時間：{timeStr(result.timestamp)}
              </Text>
              {result.sequence.map((item, idx) => (
                <Text key={idx} style={{ fontSize: 14 }}>
                  第{idx + 1}筆 - 電流: {item.current}，電壓: {item.voltage}
                  ，功率: {item.power}，溫度: {item.temp_C}
                </Text>
              ))}
            </>
          ) : isObject(result) ? (
            <Text selectable style={styles.codeBlock}>
              {JSON.stringify(result, null, 2)}
            </Text>
          ) : (
            <Text selectable style={styles.codeBlock}>
              {result}
            </Text>
          )}
        </View>
      ) : (
        <Text style={{ marginTop: 16 }}>尚無資料，請設定 IP 與路徑後查詢</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "stretch",
    backgroundColor: "#fff",
    minHeight: "100%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginVertical: 8,
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2277bb",
  },
  label: {
    fontSize: 14,
    color: "#444",
    marginTop: 8,
  },
  error: {
    color: "red",
    marginTop: 20,
    fontWeight: "bold",
  },
  codeBlock: {
    backgroundColor: "#eee",
    padding: 10,
    marginTop: 12,
    borderRadius: 6,
    fontFamily: "monospace",
    fontSize: 13,
  },
});
