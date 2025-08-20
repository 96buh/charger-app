import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BatteryDataProvider } from "@/contexts/BatteryDataContext";
import { HardwareDataProvider } from "@/contexts/HardwareContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AlertProvider } from "@/contexts/AlertContext";
import { ChargeHistoryProvider } from "@/contexts/ChargeHistoryContext";
import { ErrorLogProvider } from "@/contexts/ErrorLogContext";
import FlashMessage from "react-native-flash-message";
import Constants from "expo-constants";

import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { registerBackgroundMonitor } from "@/utils/backgroundMonitor";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    Notifications.requestPermissionsAsync();
    registerBackgroundMonitor();
  }, []);

  return (
    <>
      <SettingsProvider>
        <ChargeHistoryProvider>
          <ErrorLogProvider>
            <HardwareDataProvider>
              <BatteryDataProvider>
                <AlertProvider>
                  <FlashMessage
                    position="top"
                    statusBarHeight={Constants.statusBarHeight}
                  />
                  <StatusBar style="dark" hidden={false} />
                  <Stack>
                    {/*<Stack.Screen name="(auth)" options={{ headerShown: false }} />*/}
                    <Stack.Screen
                      name="(tabs)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen name="+not-found" options={{}} />
                  </Stack>
                </AlertProvider>
              </BatteryDataProvider>
            </HardwareDataProvider>
          </ErrorLogProvider>
        </ChargeHistoryProvider>
      </SettingsProvider>
    </>
  );
}
