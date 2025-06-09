import Slider from "@react-native-community/slider"; // 滑桿元件（需額外安裝套件）
import { useRouter } from "expo-router"; // Expo Router 導入 router
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Settings() {
  // 各種狀態的 useState
  const router = useRouter(); // 取得 router
  const [notifyEnabled, setNotifyEnabled] = useState(true); // 是否允許通知
  const [soundEnabled, setSoundEnabled] = useState(true); // 是否開啟聲音
  const [vibrationEnabled, setVibrationEnabled] = useState(true); // 是否開啟震動
  const [language, setLanguage] = useState("zh"); // 語言選擇："zh"或"en"
  const [temp1, setTemp1] = useState(37); // 第一階段溫度值
  const [temp2, setTemp2] = useState(52); // 第二階段溫度值

  const handleAccountAction = (action: "帳戶名稱" | "修改密碼" | "登出") => {
    if (action === "帳戶名稱") {
      router.push("/(auth)/account"); // 跳到 /account 頁面
    } else if (action === "修改密碼") {
      router.push("../change-password"); // 跳到 /change-password 頁面
    } else if (action === "登出") {
      Alert.alert("登出", "確定要登出？", [
        { text: "否", style: "cancel" },
        { text: "是", onPress: () => router.push("/logout") },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {/* 開關：允許通知 */}
      <View style={styles.row}>
        <Text style={styles.label}>允許通知</Text>
        <Switch value={notifyEnabled} onValueChange={setNotifyEnabled} />
      </View>

      {/* 開關：聲音 */}
      <View style={styles.row}>
        <Text style={styles.label}>聲音</Text>
        <Switch value={soundEnabled} onValueChange={setSoundEnabled} />
      </View>

      {/* 開關：震動 */}
      <View style={styles.row}>
        <Text style={styles.label}>震動</Text>
        <Switch value={vibrationEnabled} onValueChange={setVibrationEnabled} />
      </View>

      {/* 語言切換標題 */}
      <Text style={styles.sectionTitle}>設定語言</Text>

      {/* 語言切換按鈕列 */}
      <View style={styles.languageRow}>
        {/* 繁體中文按鈕 */}
        <TouchableOpacity
          style={[
            styles.languageButton,
            language === "zh" && styles.selectedLanguage,
          ]}
          onPress={() => setLanguage("zh")}
        >
          <Text
            style={
              language === "zh" ? styles.selectedText : styles.languageText
            }
          >
            繁體中文
          </Text>
        </TouchableOpacity>

        {/* 英文按鈕 */}
        <TouchableOpacity
          style={[
            styles.languageButton,
            language === "en" && styles.selectedLanguage,
          ]}
          onPress={() => setLanguage("en")}
        >
          <Text
            style={
              language === "en" ? styles.selectedText : styles.languageText
            }
          >
            英文
          </Text>
        </TouchableOpacity>
      </View>

      {/* 溫度通知標題 */}
      <Text style={styles.sectionTitle}>溫度過熱通知</Text>

      {/* 第一階段滑桿 */}
      <View style={styles.sliderRow}>
        <Text style={styles.label}>第一階段 35~45°C：{temp1}</Text>
        <Slider
          style={{ width: 250 }}
          minimumValue={35}
          maximumValue={45}
          step={1}
          value={temp1}
          onValueChange={setTemp1}
        />
      </View>

      {/* 第二階段滑桿 */}
      <View style={styles.sliderRow}>
        <Text style={styles.label}>第二階段 45~55°C：{temp2}</Text>
        <Slider
          style={{ width: 250 }}
          minimumValue={45}
          maximumValue={55}
          step={1}
          value={temp2}
          onValueChange={setTemp2}
        />
      </View>

      <Text style={styles.sectionTitle}>帳戶管理</Text>
      <TouchableOpacity
        style={styles.accountButton}
        onPress={() => handleAccountAction("帳戶名稱")}
      >
        <Text style={styles.label}>帳戶名稱</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.accountButton}
        onPress={() => handleAccountAction("修改密碼")}
      >
        <Text style={styles.label}>修改密碼</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.accountButton}
        onPress={() => handleAccountAction("登出")}
      >
        <Text style={styles.label}>登出</Text>
      </TouchableOpacity>
    </View>
  );
}

// 樣式設定區
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "white" }, // 整體頁面容器
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#7D7DFF",
  }, // 標題
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  }, // 開關列
  sliderRow: { marginVertical: 10 }, // 滑桿列
  label: { fontSize: 16 }, // 標籤文字
  sectionTitle: {
    fontSize: 18,
    marginTop: 20,
    fontWeight: "bold",
    backgroundColor: "#D3D3D3",
    padding: 5,
  }, // 分區標題
  languageRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  }, // 語言選擇列
  languageButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#999",
    alignItems: "center",
  },
  selectedLanguage: { backgroundColor: "#7D7DFF" }, // 被選到的語言按鈕
  languageText: { fontSize: 16 },
  selectedText: { fontSize: 16, color: "white" }, // 被選中時的文字顏色
  accountButton: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
});
