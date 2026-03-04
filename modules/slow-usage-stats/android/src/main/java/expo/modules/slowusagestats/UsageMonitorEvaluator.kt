package expo.modules.slowusagestats

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.SharedPreferences

class UsageMonitorEvaluator(private val context: Context) {

    companion object {
        // Threshold for testing: 1 minute continuous usage.
        // In production this might be higher, e.g., 10 or 15 minutes.
        private const val THRESHOLD_MS: Long = 1 * 60 * 1000

        // Cooldown between passive alerts for the SAME app
        private const val COOLDOWN_MS: Long = 15 * 60 * 1000
    }

    private val prefs: SharedPreferences = context.getSharedPreferences("slow_prefs", Context.MODE_PRIVATE)

    fun evaluateUsage() {
        try {
            val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val endTime = System.currentTimeMillis()
            val startTime = endTime - (15 * 60 * 1000) // Check last 15 mins
            
            val usageEvents = usageStatsManager.queryEvents(startTime, endTime)
            val event = UsageEvents.Event()
            
            var currentAppFullTime: Long = 0
            var lastResumeTime: Long = 0
            var currentPackage: String? = null
            
            // Replay events to calculate continuous foreground time for the current active app
            while (usageEvents.hasNextEvent()) {
                usageEvents.getNextEvent(event)
                
                if (event.packageName == context.packageName || event.packageName.contains("launcher") || event.packageName.contains("systemui")) {
                    continue
                }

                if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED) {
                    currentPackage = event.packageName
                    lastResumeTime = event.timeStamp
                } else if (event.eventType == UsageEvents.Event.ACTIVITY_PAUSED || event.eventType == UsageEvents.Event.ACTIVITY_STOPPED) {
                    if (currentPackage == event.packageName && lastResumeTime > 0) {
                        currentAppFullTime += (event.timeStamp - lastResumeTime)
                        lastResumeTime = 0
                    }
                }
            }
            
            // If currently in foreground, add time up to now
            if (lastResumeTime > 0) {
                currentAppFullTime += (endTime - lastResumeTime)
            }
            
            if (currentPackage != null && currentAppFullTime > 0) {
                android.util.Log.d("SlowMonitor", "Current App: $currentPackage, Foreground Time: ${currentAppFullTime / 1000}s")
            }

            if (currentAppFullTime >= THRESHOLD_MS && currentPackage != null) {
                triggerAlertIfCooldownPassed(currentPackage, currentAppFullTime, endTime)
            }

        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun triggerAlertIfCooldownPassed(pkg: String, durationMs: Long, currentTime: Long) {
        val lastAlertTime = prefs.getLong("last_alert_$pkg", 0)
        
        if (currentTime - lastAlertTime > COOLDOWN_MS) {
            android.util.Log.d("SlowMonitor", "Threshold reached for $pkg! Dispatching Native Notification...")
            
            val pm = context.packageManager
            var appName = pkg
            try {
                val appInfo = pm.getApplicationInfo(pkg, 0)
                appName = pm.getApplicationLabel(appInfo).toString()
            } catch (e: Exception) {
                e.printStackTrace()
            }

            val durationMinutes = (durationMs / (1000 * 60)).toInt()
            
            NotificationHelper.dispatchPassiveAlert(
                context, 
                "Tiempo en $appName", 
                "Parece que llevas $durationMinutes minutos seguidos en esta app. ¿Todo bien?",
                pkg
            )
            
            prefs.edit().putLong("last_alert_$pkg", currentTime).apply()
        }
    }
}
