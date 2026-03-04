import SlowUsageStats from '../modules/slow-usage-stats';

export const UsageStatsService = {
    checkPermission: async (): Promise<boolean> => {
        try {
            if (!SlowUsageStats) return false;
            return await SlowUsageStats.checkPermission();
        } catch (e) {
            console.error('UsageStats check error', e);
            return false;
        }
    },

    requestPermission: (): void => {
        if (SlowUsageStats) {
            SlowUsageStats.requestPermission();
        } else {
            console.warn('SlowUsageStats is not available. Are you running in Expo Go?');
        }
    },

    canDrawOverlays: async (): Promise<boolean> => {
        try {
            if (!SlowUsageStats) return false;
            return await SlowUsageStats.canDrawOverlays();
        } catch (e) {
            console.error('Draw Overlays check error', e);
            return false;
        }
    },

    requestOverlayPermission: (): void => {
        if (SlowUsageStats) {
            SlowUsageStats.requestOverlayPermission();
        } else {
            console.warn('SlowUsageStats is not available. Are you running in Expo Go?');
        }
    },

    getLastUsedApp: async (): Promise<string | null> => {
        try {
            if (!SlowUsageStats) return null;
            return await SlowUsageStats.getLastUsedApp();
        } catch (e) {
            console.error('Error getting last used app', e);
            return null;
        }
    },

    sendPassiveNotification: (title: string, message: string): void => {
        try {
            if (SlowUsageStats && SlowUsageStats.sendPassiveNotification) {
                SlowUsageStats.sendPassiveNotification(title, message);
            }
        } catch (e) {
            console.error('Error sending passive notification', e);
        }
    },

    startMonitorService: (): void => {
        try {
            if (SlowUsageStats && SlowUsageStats.startMonitorService) {
                SlowUsageStats.startMonitorService();
                console.log('Native Foreground Usage Monitor started.');
            }
        } catch (e) {
            console.error('Failed to start monitor service', e);
        }
    },

    stopMonitorService: (): void => {
        try {
            if (SlowUsageStats && SlowUsageStats.stopMonitorService) {
                SlowUsageStats.stopMonitorService();
                console.log('Native Foreground Usage Monitor stopped.');
            }
        } catch (e) {
            console.error('Failed to stop monitor service', e);
        }
    }
};
