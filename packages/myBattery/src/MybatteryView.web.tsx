import * as React from 'react';

import { MybatteryViewProps } from './Mybattery.types';

export default function MybatteryView(props: MybatteryViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
