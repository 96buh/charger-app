import { registerWebModule, NativeModule } from 'expo';

import { MybatteryModuleEvents } from './Mybattery.types';

class MybatteryModule extends NativeModule<MybatteryModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(MybatteryModule, 'MybatteryModule');
