import { NativeModule, requireNativeModule } from 'expo';

import { MybatteryModuleEvents } from './Mybattery.types';

declare class MybatteryModule extends NativeModule<MybatteryModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<MybatteryModule>('Mybattery');
