import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";

export default function TabsLayout() {
  const router = useRouter();
  return (
    <>
      <Tabs 
        screenOptions={{
          tabBarActiveTintColor: "orange", //標籤顏色
          headerStyle: {
            backgroundColor: "#7D7DFF", // background color
          },
          headerShadowVisible: false,
          headerTintColor: "white",
          tabBarStyle: {
            backgroundColor: "white",
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            headerTitle: "即時訊息顯示",
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? "battery-charging" : "battery-charging-outline"} //點擊標籤時顯示填滿的圖示;反之顯示空心的圖示
                color={color} //tabBarActiveTintColor設定的顏色
                size={30} //大小
              />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            headerTitle: "歷史充電查詢",
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? "timer-sharp" : "timer-outline"} //點擊標籤時顯示填滿的圖示;反之顯示空心的圖示
                color={color} //tabBarActiveTintColor設定的顏色
                size={30} //大小
              />
            ),
          }}
        />
        <Tabs.Screen
          name="error"
          options={{
            headerTitle: "歷史異常紀錄",
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? "warning-sharp" : "warning-outline"} //點擊標籤時顯示填滿的圖示;反之顯示空心的圖示
                color={color} //tabBarActiveTintColor設定的顏色
                size={30} //大小
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            headerTitle: "設定",
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? "settings-sharp" : "settings-outline"} //點擊標籤時顯示填滿的圖示;反之顯示空心的圖示
                color={color} //tabBarActiveTintColor設定的顏色
                size={30} //大小
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
