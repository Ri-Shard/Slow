import { NativeModules } from 'react-native';

const { UsageStatsModule } = NativeModules;

export const UsageStatsService = {
    checkPermission: async (): Promise<boolean> => {
        try {
            if (!UsageStatsModule) return false;
            return await UsageStatsModule.checkPermission();
        } catch (e) {
            console.error('UsageStats check error', e);
            return false;
        }
    },

    requestPermission: (): void => {
        if (UsageStatsModule) {
            UsageStatsModule.requestPermission();
        } else {
            console.warn('UsageStatsModule is not available. Are you running in Expo Go?');
        }
    },

    getLastUsedApp: async (): Promise<string | null> => {
        try {
            if (!UsageStatsModule) return null;
            return await UsageStatsModule.getLastUsedApp();
        } catch (e) {
            console.error('Error getting last used app', e);
            return null;
        }
    },

    sendPassiveNotification: (title: string, message: String): void => {
        try {
            if (UsageStatsModule && UsageStatsModule.sendPassiveNotification) {
                UsageStatsModule.sendPassiveNotification(title, message);
            }
        } catch (e) {
            console.error('Error sending passive notification', e);
        }
    },

    startMonitorService: (): void => {
        try {
            if (UsageStatsModule && UsageStatsModule.startMonitorService) {
                UsageStatsModule.startMonitorService();
                console.log('Native Foreground Usage Monitor started.');
            }
        } catch (e) {
            console.error('Failed to start monitor service', e);
        }
    },

    stopMonitorService: (): void => {
        try {
            if (UsageStatsModule && UsageStatsModule.stopMonitorService) {
                UsageStatsModule.stopMonitorService();
                console.log('Native Foreground Usage Monitor stopped.');
            }
        } catch (e) {
            console.error('Failed to stop monitor service', e);
        }
    }
};
