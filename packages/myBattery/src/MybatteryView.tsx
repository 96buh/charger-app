import { requireNativeView } from 'expo';
import * as React from 'react';

import { MybatteryViewProps } from './Mybattery.types';

const NativeView: React.ComponentType<MybatteryViewProps> =
  requireNativeView('Mybattery');

export default function MybatteryView(props: MybatteryViewProps) {
  return <NativeView {...props} />;
}
