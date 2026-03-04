import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './SlowUsageStats.types';

type SlowUsageStatsModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class SlowUsageStatsModule extends NativeModule<SlowUsageStatsModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(SlowUsageStatsModule, 'SlowUsageStatsModule');
