import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BatteryDataProvider } from "@/contexts/BatteryDataContext";

export default function RootLayout() {
  return (
    <>
      <BatteryDataProvider>
        <StatusBar style="light" />
        <Stack>
          {/*<Stack.Screen name="(auth)" options={{ headerShown: false }} />*/}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{}} />
        </Stack>
      </BatteryDataProvider>
    </>
  );
}
