package expo.modules.slowusagestats

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class UnlockReceiver : BroadcastReceiver() {

    companion object {
        // Keeps backwards compatibility for any external calls to sendPassiveNotification
        fun sendPassiveNotification(context: Context, title: String, message: String) {
            NotificationHelper.createChannels(context)
            NotificationHelper.dispatchPassiveAlert(context, title, message)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_USER_PRESENT) return

        NotificationHelper.createChannels(context)
        OverlayPermissionHelper.launchFrictionlessApp(context, "slow://pause")
        
        // As a fallback/diagnostic, dispatch the pause notification directly
        // if for some reason the activity refuses to launch.
        if (!OverlayPermissionHelper.hasOverlayPermission(context)) {
             NotificationHelper.dispatchPauseNotification(context)
        }
    }
}
