package com.alhaddad.islami;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import androidx.core.content.ContextCompat;

public final class AdhanReceiver extends BroadcastReceiver {

    private static final String TAG = "AdhanReceiver";
    public static final String ACTION_STOP_ADHAN = "com.alhaddad.islami.STOP_ADHAN";

    private static final String EXTRA_KIND = "kind";
    private static final String EXTRA_ID = "id";
    private static final String EXTRA_TITLE = "title";
    private static final String EXTRA_BODY = "body";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null || intent == null) return;

        final String action = intent.getAction();

        // 1. إيقاف الأذان
        if (ACTION_STOP_ADHAN.equals(action)) {
            try {
                context.stopService(new Intent(context, AdhanService.class));
                NotificationHelper.cancelAdhanNotification(context);
                NotificationHelper.updatePersistent(context);
                AdhanScheduler.scheduleNextAdhan(context);
            } catch (Exception e) {
                Log.e(TAG, "خطأ في إيقاف الأذان", e);
            }
            return;
        }

        // 2. استقبال التذكيرات
        if (AdhanScheduler.ACTION_REMINDER.equals(action)) {
            try {
                int id = intent.getIntExtra(EXTRA_ID, 777);
                String title = intent.getStringExtra(EXTRA_TITLE);
                String body = intent.getStringExtra(EXTRA_BODY);
                long intervalMillis = intent.getLongExtra("intervalMillis", 3600000L);

                NotificationHelper.showReminder(
                        context,
                        id,
                        title != null ? title : "تذكير",
                        body != null ? body : ""
                );

                AdhanScheduler.scheduleReminderAlarm(context, id, intervalMillis, title, body);
            } catch (Exception e) {
                Log.e(TAG, "خطأ في معالجة التذكير، تم منع انهيار التطبيق", e);
            }
            return;
        }

        // 3. استقبال الأذان
        final String kind = intent.getStringExtra(EXTRA_KIND);
        final boolean isAdhanAction = AdhanScheduler.ACTION_ALARM.equals(action);

        if (!isAdhanAction && kind == null) return;

        try {
            if (isAdhanAction || "adhan".equals(kind)) {
                Intent serviceIntent = new Intent(context, AdhanService.class);
                serviceIntent.putExtras(intent);
                ContextCompat.startForegroundService(context, serviceIntent);
                NotificationHelper.updatePersistent(context);
                AdhanScheduler.scheduleNextAdhan(context);

            } else if ("reminder".equals(kind)) {
                NotificationHelper.showReminder(
                        context,
                        intent.getIntExtra(EXTRA_ID, 0),
                        intent.getStringExtra(EXTRA_TITLE),
                        intent.getStringExtra(EXTRA_BODY)
                );

            } else if ("time".equals(kind) || "phase".equals(kind)) {
                NotificationHelper.updatePersistent(context);
            }
        } catch (Exception e) {
            Log.e(TAG, "خطأ في استقبال المنبه، تم منع الانهيار", e);
        }
    }
}