import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import * as Battery from "expo-battery";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const BACKGROUND_MONITOR_TASK = "background-monitor";

TaskManager.defineTask(BACKGROUND_MONITOR_TASK, async () => {
  try {
    const raw = await AsyncStorage.getItem("app_settings");
    const settings = raw ? JSON.parse(raw) : {};
    if (!settings.notificationsEnabled) {
      return BackgroundFetch.Result.NoData;
    }

    const power = (await Battery.getPowerStateAsync()) as any;
    const batteryLevel = power?.batteryLevel ?? 0;
    const batteryState = power?.batteryState;
    const temperature = power?.batteryTemperature;
    const chargeThreshold = settings.chargeThreshold ?? 0.9;
    const tempThreshold = settings.tempThreshold ?? 40;

    if (
      batteryState === Battery.BatteryState.FULL ||
      batteryLevel >= chargeThreshold
    ) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Charging complete",
          body: `Battery reached ${Math.round(batteryLevel * 100)}%`,
        },
        trigger: null,
      });
      return BackgroundFetch.Result.NewData;
    }

    if (temperature != null && temperature > tempThreshold) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "High battery temperature",
          body: `Temperature is ${temperature}\u00B0C`,
        },
        trigger: null,
      });
      return BackgroundFetch.Result.NewData;
    }

    return BackgroundFetch.Result.NoData;
  } catch (e) {
    return BackgroundFetch.Result.Failed;
  }
});

export async function registerBackgroundMonitor() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_MONITOR_TASK
  );
  if (!isRegistered) {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_MONITOR_TASK, {
      minimumInterval: 60 * 15,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }
}
