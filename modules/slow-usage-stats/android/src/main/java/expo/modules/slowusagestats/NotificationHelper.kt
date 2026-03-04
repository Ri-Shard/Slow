package expo.modules.slowusagestats

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat

object NotificationHelper {

    const val PASSIVE_ALERT_ID = 1002
    const val PAUSE_NOTIFICATION_ID = 1001
    const val FOREGROUND_SERVICE_ID = 9999

    const val ALERT_CHANNEL_ID = "slow_alert_channel"
    const val PAUSE_CHANNEL_ID = "slow_pause_channel"
    const val MONITOR_CHANNEL_ID = "slow_foreground_service"

    private fun getManager(context: Context): NotificationManager {
        return context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    }

    fun createChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getManager(context)

            // Alert Channel (Standard)
            val alertChannel = NotificationChannel(
                ALERT_CHANNEL_ID,
                "Alertas de Uso",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Alertas cuando llevas mucho tiempo en una aplicación."
                enableVibration(true)
            }

            // Pause Channel (High Priority)
            val pauseChannel = NotificationChannel(
                PAUSE_CHANNEL_ID,
                "Pausa de Consciencia",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Slow te invita a hacer una pausa consciente."
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
                enableVibration(true)
                setShowBadge(true)
            }

            // Monitor Channel (Low Priority)
            val monitorChannel = NotificationChannel(
                MONITOR_CHANNEL_ID,
                "Slow Monitor",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Mantiene Slow activo para proteger tu tiempo"
                setShowBadge(false)
            }

            manager.createNotificationChannels(listOf(alertChannel, pauseChannel, monitorChannel))
        }
    }

    private fun getAppLaunchIntent(context: Context, deepLink: String = "slow://"): Intent {
        val pm = context.packageManager
        val launchIntent = pm.getLaunchIntentForPackage(context.packageName) ?: Intent()
        launchIntent.action = Intent.ACTION_VIEW
        launchIntent.data = Uri.parse(deepLink)
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        return launchIntent
    }

    fun buildForegroundServiceNotification(context: Context): Notification {
        val launchIntent = getAppLaunchIntent(context, "slow://")
        val pendingIntent = PendingIntent.getActivity(
            context, 0, launchIntent,
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(context, MONITOR_CHANNEL_ID)
            .setContentTitle("Slow está activo")
            .setContentText("Cuidando tu tiempo en segundo plano")
            .setSmallIcon(context.resources.getIdentifier("ic_launcher", "mipmap", context.packageName))
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    fun dispatchPassiveAlert(context: Context, title: String, message: String, appPackage: String? = null) {
        val launchIntent = getAppLaunchIntent(context, "slow://")

        val pendingIntent = PendingIntent.getActivity(
            context,
            PASSIVE_ALERT_ID,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(context, ALERT_CHANNEL_ID)
            .setSmallIcon(context.resources.getIdentifier("ic_launcher", "mipmap", context.packageName))
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)

        val notificationId = appPackage?.hashCode() ?: PASSIVE_ALERT_ID
        getManager(context).notify(notificationId, builder.build())
    }

    fun dispatchPauseNotification(context: Context) {
        val launchIntent = getAppLaunchIntent(context, "slow://pause")

        val pendingIntent = PendingIntent.getActivity(
            context,
            PAUSE_NOTIFICATION_ID,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, PAUSE_CHANNEL_ID)
            .setSmallIcon(context.resources.getIdentifier("ic_launcher", "mipmap", context.packageName))
            .setContentTitle("Momento de Pausa")
            .setContentText("¿Qué necesitas ahora mismo?")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setOngoing(false)
            .setContentIntent(pendingIntent)
            .setFullScreenIntent(pendingIntent, true)
            .build()

        getManager(context).notify(PAUSE_NOTIFICATION_ID, notification)
    }
}
