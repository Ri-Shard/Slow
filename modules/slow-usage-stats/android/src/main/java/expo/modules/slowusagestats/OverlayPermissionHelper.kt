package expo.modules.slowusagestats

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings

object OverlayPermissionHelper {

    fun hasOverlayPermission(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(context)
        } else {
            true // Permissions granted at install time for older versions
        }
    }

    fun requestOverlayPermission(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(context)) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:${context.packageName}")
                )
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
            }
        }
    }

    private fun getAppLaunchIntent(context: Context, deepLink: String = "slow://"): Intent {
        val intent = Intent(Intent.ACTION_VIEW)
        intent.data = Uri.parse(deepLink)
        intent.setPackage(context.packageName)
        intent.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK or 
            Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
            Intent.FLAG_ACTIVITY_CLEAR_TOP or 
            Intent.FLAG_ACTIVITY_SINGLE_TOP
        )
        return intent
    }

    fun launchFrictionlessApp(context: Context, deepLink: String = "slow://pause") {
        if (hasOverlayPermission(context)) {
            val launchIntent = getAppLaunchIntent(context, deepLink)
            context.startActivity(launchIntent)
        } else {
            // Fallback if permission is missing
            NotificationHelper.dispatchPauseNotification(context)
        }
    }
}
