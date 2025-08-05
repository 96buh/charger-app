import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BatteryDataProvider } from "@/contexts/BatteryDataContext";
import { HardwareDataProvider } from "@/contexts/HardwareContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AlertProvider } from "@/contexts/AlertContext";
import { ChargeHistoryProvider } from "@/contexts/ChargeHistoryContext";
import FlashMessage from "react-native-flash-message";
import Constants from "expo-constants";

export default function RootLayout() {
  return (
    <>
      <SettingsProvider>
        <HardwareDataProvider>
          <BatteryDataProvider>
            <ChargeHistoryProvider>
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
            </ChargeHistoryProvider>
          </BatteryDataProvider>
        </HardwareDataProvider>
      </SettingsProvider>
    </>
  );
}
