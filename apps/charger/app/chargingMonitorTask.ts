import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import * as Battery from "expo-battery";

export const TASK_CHARGING_MONITOR = "TASK_CHARGING_MONITOR";

TaskManager.defineTask(TASK_CHARGING_MONITOR, async () => {
  try {
    const state = await Battery.getBatteryStateAsync();
    console.log("Battery state:", state);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.log("Background fetch failed:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerChargingMonitorAsync() {
  return BackgroundFetch.registerTaskAsync(TASK_CHARGING_MONITOR, {
    minimumInterval: 15 * 60,
    stopOnTerminate: false,
    startOnBoot: true,
  });
}
