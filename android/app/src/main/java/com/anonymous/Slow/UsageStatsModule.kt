package com.anonymous.Slow

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.*

class UsageStatsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "UsageStatsModule"

    @ReactMethod
    fun checkPermission(promise: Promise) {
        val appOps = reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                reactApplicationContext.packageName
            )
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                reactApplicationContext.packageName
            )
        }
        promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
    }

    @ReactMethod
    fun requestPermission() {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

        val activity = reactApplicationContext.currentActivity
        if (activity != null) {
            activity.startActivity(intent)
        } else {
            reactApplicationContext.startActivity(intent)
        }
    }

    @ReactMethod
    fun getLastUsedApp(promise: Promise) {
        try {
            val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as android.app.usage.UsageStatsManager
            val endTime = System.currentTimeMillis()
            val startTime = endTime - 1000 * 60 * 10 // Last 10 mins

            val usageStats = usageStatsManager.queryUsageStats(
                android.app.usage.UsageStatsManager.INTERVAL_DAILY,
                startTime,
                endTime
            )

            if (usageStats != null && usageStats.isNotEmpty()) {
                val sortedStats = usageStats.sortedByDescending { it.lastTimeUsed }
                
                // Get all launcher packages to skip them
                val intent = Intent(Intent.ACTION_MAIN).apply { addCategory(Intent.CATEGORY_HOME) }
                val resolveInfos = reactApplicationContext.packageManager.queryIntentActivities(intent, 0)
                val launcherPackages = resolveInfos.map { it.activityInfo.packageName }.toSet()
                
                val myPackage = reactApplicationContext.packageName
                val lastApp = sortedStats.firstOrNull { 
                    it.packageName != myPackage && 
                    !launcherPackages.contains(it.packageName) &&
                    !it.packageName.contains("permissioncontroller") &&
                    !it.packageName.contains("systemui")
                }
                
                promise.resolve(lastApp?.packageName ?: sortedStats[0].packageName)
            } else {
                promise.resolve(null)
            }
        } catch (e: Exception) {
            promise.reject("ERROR_GETTING_LAST_APP", e.message)
        }
    }

    @ReactMethod
    fun sendPassiveNotification(title: String, message: String) {
        UnlockReceiver.sendPassiveNotification(reactApplicationContext, title, message)
    }

    @ReactMethod
    fun startMonitorService() {
        UsageMonitorService.start(reactApplicationContext)
    }

    @ReactMethod
    fun stopMonitorService() {
        UsageMonitorService.stop(reactApplicationContext)
    }
}
