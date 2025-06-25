import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Button,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { supabase } from "../../supabase"; //supabase 設定檔

export default function AccountScreen() {
  // 狀態變數
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); //註冊用的確認密碼
  const [message, setMessage] = useState(""); //提示訊息
  const [isLogin, setIsLogin] = useState(true); //切換登入/註冊模式
  const [user, setUser] = useState<any>(null); //使用者登入狀態

  const router = useRouter();

  useEffect(() => {
    // 定義一個 async 函式來取得目前登入的使用者資訊
    const getUser =  async () => {
      const { data } = await supabase.auth.getUser(); // 從 Supabase 取得目前的使用者
      setUser(data.user); // 將使用者設定到本地 state 中
    };
    getUser(); // 一進入畫面就執行一次（載入時抓使用者）

    // 設定一個監聽器：監聽登入 / 登出 / 註冊 等狀態改變
    const { data: Listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null); // 如果有 session，代表有登入，否則為 null
    });

    // 在組件卸載時移除監聽器（避免記憶體洩漏）
    return() => {
      Listener.subscription.unsubscribe();
    };
  }, []);   

  // 驗證與登入 / 註冊行為
  const handleAuth = async () => {
    if (!email.includes("@")) {
      setMessage("❌ 請輸入有效的 Email。");
      return;
    }
    if (password.length < 6) {
      setMessage("❌ 密碼長度需至少 6 個字元。");
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      setMessage("❌ 兩次輸入的密碼不一致。");
      return;
    }

    try {
      // 登入and註冊
      if (isLogin) {
        const{error} = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if(error) throw error; // 如果有錯誤，則拋出錯誤
        setMessage("✅ 登入成功！"); // 登入成功提示，沒出錯則顯示此訊息
      } else { //註冊
        const{error} = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error; // 如果有錯誤，則拋出錯誤
        setMessage("✅ 註冊成功！請前往信箱驗證。");
      }
    }
    // 捕捉 try 區塊中可能發生的錯誤（如登入/註冊失敗） 
    catch (error: any) {
        setMessage(`❌ ${isLogin ? "登入" : "註冊"}失敗：${error.message}`);
    }
  };

  // 登出
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut(); // 呼叫 Supabase 的登出方法
    if(error){
      setMessage(`❌ 登出失敗：${error.message}`); // 如果登出失敗，顯示錯誤訊息
    }
    else{
      setMessage("✅ 登出成功！"); // 登出成功提示
      setUser(null); // 清除使用者狀態
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>歡迎使用{"\n"}檢測充電線異常app🔋</Text>
      {user ? (
        // 登入後畫面
        <>
          <Text style={styles.message}>👤 歡迎：{user.email}</Text>
          <Button title="登出" onPress={handleLogout} />
        </>
      ) : (
        // 登入 / 註冊表單
        <>
          <Text style={styles.title}>{isLogin ? "登入" : "註冊"}</Text>
          <TextInput
            style={styles.input}
            placeholder="請輸入email"
            placeholderTextColor="#999"
            autoCapitalize="none"
            onChangeText={setEmail}
            value={email}
          />
          <TextInput
            style={styles.input}
            placeholder="請輸入密碼(至少6個字元)"
            placeholderTextColor="#999"
            secureTextEntry
            onChangeText={setPassword}
            value={password}
          />
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="確認密碼"
              placeholderTextColor="#999"
              secureTextEntry
              onChangeText={setConfirmPassword}
              value={confirmPassword}
            />
          )}
          <Button title={isLogin ? "登入" : "註冊"} onPress={handleAuth} />

          {/* 修改密碼按鈕 */}
          <TouchableOpacity onPress={() => router.push("/change-password")}>
            <Text style={styles.toggleText}>修改密碼</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setIsLogin(!isLogin);          // 切換登入 / 註冊模式
              setEmail("");                  // 清空 email
              setPassword("");               // 清空密碼
              setConfirmPassword("");        // 清空確認密碼
              setMessage("");                // 清空提示訊息
            }}
          >
            <Text style={styles.toggleText}>
              {isLogin ? "還沒有帳號？點我註冊" : "已有帳號？點我登入"}
            </Text>
          </TouchableOpacity>
        </>
      )}
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
    borderRadius: 5
  },
  message: {
    fontSize: 20,
    marginTop: 20,
    textAlign: "center",
    color: "#333"
  },
  welcome: {
    fontSize: 30,
    textAlign: "center",
    paddingTop: 50,
    position: "absolute",
    top: 50,
    width: "110%"
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20
  },
  toggleText: {
    color: "blue",
    marginTop: 10,
    textAlign: "center"
  }
});