package expo.modules.slowusagestats

import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper

class UsageMonitorService : Service() {

    private val handler = Handler(Looper.getMainLooper())
    private val checkInterval: Long = 60 * 1000 // Every 1 minute
    private var isRunning = false
    private lateinit var evaluator: UsageMonitorEvaluator

    companion object {
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
        evaluator = UsageMonitorEvaluator(this)
        
        NotificationHelper.createChannels(this)
        if (Build.VERSION.SDK_INT >= 34) { // Android 14 (UPSIDE_DOWN_CAKE)
            startForeground(
                NotificationHelper.FOREGROUND_SERVICE_ID,
                NotificationHelper.buildForegroundServiceNotification(this),
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
            )
        } else {
            startForeground(
                NotificationHelper.FOREGROUND_SERVICE_ID,
                NotificationHelper.buildForegroundServiceNotification(this)
            )
        }
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
            evaluator.evaluateUsage()
            handler.postDelayed(this, checkInterval)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        isRunning = false
        handler.removeCallbacks(monitorRunnable)
        super.onDestroy()
    }
}
