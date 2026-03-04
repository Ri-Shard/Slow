package expo.modules.slowusagestats

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SlowUsageStatsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SlowUsageStats")

    AsyncFunction("checkPermission") { promise: Promise ->
      val context = appContext.reactContext ?: return@AsyncFunction
      val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), context.packageName)
      } else {
          appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), context.packageName)
      }
      promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
    }

    Function("requestPermission") {
      val context = appContext.reactContext
      if (context != null) {
          val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
              addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
          val activity = appContext.currentActivity
          if (activity != null) {
              activity.startActivity(intent)
          } else {
              context.startActivity(intent)
          }
      }
    }

    AsyncFunction("getLastUsedApp") { promise: Promise ->
      val context = appContext.reactContext ?: return@AsyncFunction
      try {
          val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as android.app.usage.UsageStatsManager
          val endTime = System.currentTimeMillis()
          val startTime = endTime - 1000 * 60 * 10 // Last 10 mins

          val usageStats = usageStatsManager.queryUsageStats(android.app.usage.UsageStatsManager.INTERVAL_DAILY, startTime, endTime)

          if (usageStats != null && usageStats.isNotEmpty()) {
              val sortedStats = usageStats.sortedByDescending { it.lastTimeUsed }
              val intent = Intent(Intent.ACTION_MAIN).apply { addCategory(Intent.CATEGORY_HOME) }
              val resolveInfos = context.packageManager.queryIntentActivities(intent, 0)
              val launcherPackages = resolveInfos.map { it.activityInfo.packageName }.toSet()
              
              val myPackage = context.packageName
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
          promise.reject("ERROR", "ERROR_GETTING_LAST_APP: ${e.message}", e)
      }
    }

    Function("sendPassiveNotification") { title: String, message: String ->
      val context = appContext.reactContext
      if (context != null) {
          UnlockReceiver.sendPassiveNotification(context, title, message)
      }
    }

    Function("startMonitorService") {
      val context = appContext.reactContext
      if (context != null) {
          UsageMonitorService.start(context)
      }
    }

    Function("stopMonitorService") {
      val context = appContext.reactContext
      if (context != null) {
          UsageMonitorService.stop(context)
      }
    }

    AsyncFunction("canDrawOverlays") { promise: Promise ->
      val context = appContext.reactContext ?: return@AsyncFunction
      val hasPermission = OverlayPermissionHelper.hasOverlayPermission(context)
      promise.resolve(hasPermission)
    }

    Function("requestOverlayPermission") {
      val context = appContext.reactContext
      if (context != null) {
          OverlayPermissionHelper.requestOverlayPermission(context)
      }
    }
  }
}
