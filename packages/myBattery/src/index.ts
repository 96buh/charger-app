// Reexport the native module. On web, it will be resolved to MybatteryModule.web.ts
// and on native platforms to MybatteryModule.ts
export { default } from './MybatteryModule';
export { default as MybatteryView } from './MybatteryView';
export * from  './Mybattery.types';
