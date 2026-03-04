// plugins/withUsageStatsPermission.js
// Expo Config Plugin to reliably add special permissions to AndroidManifest.xml
// This survives EAS rebuilds unlike manual AndroidManifest edits.
const { withAndroidManifest } = require('@expo/config-plugins');

const PERMISSIONS_TO_ADD = [
    'android.permission.PACKAGE_USAGE_STATS',
    'android.permission.POST_NOTIFICATIONS',
    'android.permission.RECEIVE_BOOT_COMPLETED',
    'android.permission.SYSTEM_ALERT_WINDOW',
    'android.permission.FOREGROUND_SERVICE',
    'android.permission.FOREGROUND_SERVICE_SPECIAL_USE',
];

const withUsageStatsPermission = (config) => {
    return withAndroidManifest(config, (config) => {
        const androidManifest = config.modResults;
        const usesPermissions = androidManifest.manifest['uses-permission'] ?? [];

        for (const permission of PERMISSIONS_TO_ADD) {
            const alreadyAdded = usesPermissions.some(
                (perm) => perm.$?.['android:name'] === permission
            );
            if (!alreadyAdded) {
                usesPermissions.push({
                    $: { 'android:name': permission },
                });
            }
        }

        androidManifest.manifest['uses-permission'] = usesPermissions;
        return config;
    });
};

module.exports = withUsageStatsPermission;
