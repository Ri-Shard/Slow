import { Colors } from '@/constants/Colors';
import '@/services/backgroundTasks';
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { LogBox, PermissionsAndroid, Platform } from 'react-native';

// Ignore the harmless keep-awake error that happens when locking the device in Expo dev mode
LogBox.ignoreLogs(['Unable to activate keep awake']);

// In development, Expo throws Unhandled Promise Rejections for KeepAwake that bypass LogBox.
// We intercept all unhandled promise rejections and silently swallow the keep-awake ones.
if (__DEV__ && Platform.OS !== 'web') {
  const tracking = require('promise/setimmediate/rejection-tracking');
  tracking.enable({
    allRejections: true,
    onUnhandled: (id: any, error: any) => {
      if (error?.message && error.message.includes('keep awake')) {
        console.log('Swallowed harmless keep-awake unhandled promise rejection');
        return;
      }
      console.warn(`Possible Unhandled Promise Rejection (id: ${id}):\n${error}`);
    },
    onHandled: (id: any) => {
      // do nothing
    },
  });
}

// Removed background fetch since we use Native Kotlin Foreground Service

SplashScreen.preventAutoHideAsync();

async function requestNotificationPermission() {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
  }
}

async function verifyUsageStatsPermission() {
  if (Platform.OS === 'android') {
    const { UsageStatsService } = require('@/services/usageStats');
    const isGranted = await UsageStatsService.checkPermission();
    if (!isGranted) {
      console.log('USAGE_STATS permission strictly missing. Opening Settings...');
      UsageStatsService.requestPermission();
    } else {
      console.log('USAGE_STATS permission is granted.');
    }
  }
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_600SemiBold,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
      requestNotificationPermission().then(() => {
        verifyUsageStatsPermission();
      });
    }
  }, [loaded, error]);

  // Check for compulsive usage when the app comes to foreground or starts
  useEffect(() => {
    const checkPassiveAlerts = async () => {
      try {
        const { getRecentUnlocks, getTodayUnlockCount } = require('@/services/database/schema');
        const history = await getRecentUnlocks(15);
        const count = await getTodayUnlockCount();

        const now = Date.now();
        let unlocksInLast10Mins = 0;

        for (const record of history) {
          if (now - new Date(record.timestamp).getTime() <= 10 * 60 * 1000) {
            unlocksInLast10Mins++;
          }
        }

        // If high frequency detected but outside of a direct pause screen block
        // (e.g. they skipped or closed it too fast recently), we send a passive alert
        if (unlocksInLast10Mins >= 6 || count > 50) {
          const { UsageStatsService } = require('@/services/usageStats');
          UsageStatsService.sendPassiveNotification(
            "Alerta de Bienestar",
            `Llevas ${count} desbloqueos hoy y mucha actividad reciente. Respira un momento.`
          );
        }
      } catch (e) {
        console.error('Passive alert check failed:', e);
      }
    };

    checkPassiveAlerts();

    // Start native Android foreground service to bypass Doze limitations
    const { UsageStatsService } = require('@/services/usageStats');
    UsageStatsService.startMonitorService();
  }, []);

  if (!loaded && !error) {
    return null;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'fade', // Transición suave en toda la app
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="pause" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="settings" />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
