// 使用Mybatter package(battery manager)得到的充電數據
export type BatteryStats = {
  current_mA: number;
  voltage_mV: number;
  temperature_C: number;
};

export type Sample = {
  t: string;
  current: number;
  voltage: number;
  temp: number;
};
