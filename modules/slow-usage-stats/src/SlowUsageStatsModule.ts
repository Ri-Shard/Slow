import { NativeModule, requireNativeModule } from 'expo';

export type SlowUsageStatsModuleEvents = {
  // Add any events here if needed in the future
};

export declare class SlowUsageStatsModule extends NativeModule<SlowUsageStatsModuleEvents> {
  checkPermission(): Promise<boolean>;
  requestPermission(): void;
  getLastUsedApp(): Promise<string | null>;
  sendPassiveNotification(title: string, message: string): void;
  startMonitorService(): void;
  stopMonitorService(): void;
  canDrawOverlays(): Promise<boolean>;
  requestOverlayPermission(): void;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<SlowUsageStatsModule>('SlowUsageStats');
