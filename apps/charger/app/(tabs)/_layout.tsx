import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSettings } from "@/contexts/SettingsContext";
import i18n from "@/utils/i18n";

export default function TabsLayout() {
  const { language } = useSettings();
  i18n.locale = language;
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "orange", //標籤顏色
          headerShown: false, // 不顯示 header
          tabBarStyle: { backgroundColor: "white" },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            headerTitle: i18n.t("realtimeDisplay"),
            tabBarLabel: i18n.t("realtimeDisplay"),
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? "battery-charging" : "battery-charging-outline"}
                color={color}
                size={30}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            headerTitle: i18n.t("historySearch"),
            tabBarLabel: i18n.t("historySearch"),
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? "timer-sharp" : "timer-outline"}
                color={color}
                size={30}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="error"
          options={{
            headerTitle: i18n.t("errorRecord"),
            tabBarLabel: i18n.t("errorRecord"),
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? "warning-sharp" : "warning-outline"}
                color={color}
                size={30}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            headerTitle: i18n.t("settings"),
            tabBarLabel: i18n.t("settings"),
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? "settings-sharp" : "settings-outline"}
                color={color}
                size={30}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
