import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle:{
            backgroundColor:"#7D7DFF",
          },
        headerShadowVisible:false,
        headerTintColor:"white",
        }}
      >
        {/* 登入/註冊頁 */}
        <Stack.Screen
          name="account"
          options={{ title: "登入/註冊" }}
        />

        {/* 修改密碼頁 */}
        <Stack.Screen
          name="change-password"
          options={{ title: "修改密碼" }}
        />
      </Stack>
    </>
  );
}
