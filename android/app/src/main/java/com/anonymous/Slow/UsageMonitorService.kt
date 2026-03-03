package com.anonymous.Slow

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat

class UsageMonitorService : Service() {

    private val handler = Handler(Looper.getMainLooper())
    private val checkInterval: Long = 60 * 1000 // Every 1 minute
    private var isRunning = false

    companion object {
        const val CHANNEL_ID = "slow_foreground_service"
        const val NOTIFICATION_ID = 9999
        
        fun start(context: Context) {
            val intent = Intent(context, UsageMonitorService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, UsageMonitorService::class.java)
            context.stopService(intent)
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!isRunning) {
            isRunning = true
            handler.post(monitorRunnable)
        }
        return START_STICKY
    }

    private val monitorRunnable = object : Runnable {
        override fun run() {
            if (!isRunning) return
            checkUsage()
            handler.postDelayed(this, checkInterval)
        }
    }

    private fun checkUsage() {
        try {
            val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as android.app.usage.UsageStatsManager
            val endTime = System.currentTimeMillis()
            val startTime = endTime - 1000 * 60 * 15 // Check last 15 mins
            
            val usageEvents = usageStatsManager.queryEvents(startTime, endTime)
            val event = android.app.usage.UsageEvents.Event()
            
            var currentAppFullTime: Long = 0
            var lastResumeTime: Long = 0
            var currentPackage: String? = null
            
            // Replay events to calculate continuous foreground time for the current active app
            while (usageEvents.hasNextEvent()) {
                usageEvents.getNextEvent(event)
                
                if (event.packageName == packageName || event.packageName.contains("launcher") || event.packageName.contains("systemui")) continue

                if (event.eventType == android.app.usage.UsageEvents.Event.ACTIVITY_RESUMED) {
                    currentPackage = event.packageName
                    lastResumeTime = event.timeStamp
                } else if (event.eventType == android.app.usage.UsageEvents.Event.ACTIVITY_PAUSED || event.eventType == android.app.usage.UsageEvents.Event.ACTIVITY_STOPPED) {
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
            
            // Threshold: 1 minute continuous usage (For Testing purposes)
            val THRESHOLD_MS = 1 * 60 * 1000
            
            if (currentPackage != null && currentAppFullTime > 0) {
                android.util.Log.d("SlowMonitor", "Current App: $currentPackage, Foreground Time: ${currentAppFullTime / 1000}s")
            }

            if (currentAppFullTime >= THRESHOLD_MS && currentPackage != null) {
                // Throttle notifications: Only alert once per binge (prevent spamming every minute)
                val prefs = getSharedPreferences("slow_prefs", Context.MODE_PRIVATE)
                val lastAlertTime = prefs.getLong("last_alert_$currentPackage", 0)
                
                if (endTime - lastAlertTime > 15 * 60 * 1000) { // 15 mins cooldown per app
                    android.util.Log.d("SlowMonitor", "Threshold reached for $currentPackage! Dispatching Native Notification...")
                    
                    // Directly pushing the notification instead of waking up React Native JS
                    val pm = packageManager
                    var appName = currentPackage
                    try {
                        val appInfo = pm.getApplicationInfo(currentPackage, 0)
                        appName = pm.getApplicationLabel(appInfo).toString()
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }

                    val durationMinutes = (currentAppFullTime / (1000 * 60)).toInt()
                    
                    val notificationChannelId = "slow_passive_alerts"
                    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                    
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        val channel = NotificationChannel(
                            notificationChannelId,
                            "Alertas de Bienestar",
                            NotificationManager.IMPORTANCE_HIGH
                        ).apply {
                            description = "Notificaciones de uso excesivo (Slow)"
                        }
                        manager.createNotificationChannel(channel)
                    }

                    val builder = NotificationCompat.Builder(this@UsageMonitorService, notificationChannelId)
                        .setSmallIcon(android.R.drawable.ic_dialog_alert)
                        .setContentTitle("Tiempo en $appName")
                        .setContentText("Parece que llevas $durationMinutes minutos seguidos en esta app. ¿Todo bien?")
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                        .setAutoCancel(true)

                    manager.notify(currentPackage.hashCode(), builder.build())
                    
                    prefs.edit().putLong("last_alert_$currentPackage", endTime).apply()
                }
            }

        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        isRunning = false
        handler.removeCallbacks(monitorRunnable)
        super.onDestroy()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Slow Monitor",
                NotificationManager.IMPORTANCE_LOW 
            ).apply {
                description = "Mantiene Slow activo para proteger tu tiempo"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val launchIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = android.app.PendingIntent.getActivity(
            this, 0, launchIntent, 
            android.app.PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Slow está activo")
            .setContentText("Cuidando tu tiempo en segundo plano")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
}
