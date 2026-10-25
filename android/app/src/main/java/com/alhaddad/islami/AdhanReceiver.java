package com.alhaddad.islami;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import androidx.core.content.ContextCompat;

/**
 * AdhanReceiver
 *
 * يستقبل تنبيهات النظام المجدولة، حتى عندما يكون التطبيق مغلقًا.
 *
 * الأنواع المدعومة:
 * - adhan: تشغيل الأذان.
 * - reminder: إشعار تذكير قبل الأذان أو للتذكيرات العامة.
 * - phase: تحديث الإشعار الدائم فقط.
 * - time: حدث صامت لتحديث التاريخ الهجري والإشعار الدائم.
 */
public final class AdhanReceiver extends BroadcastReceiver {

    private static final String TAG = "AdhanReceiver";

    // ✅ اسم مخصص وفريد لتجنب التعارض مع تطبيقات أخرى
    public static final String ACTION_STOP_ADHAN =
            "com.alhaddad.islami.STOP_ADHAN";

    private static final String EXTRA_KIND = "kind";
    private static final String EXTRA_ID = "id";
    private static final String EXTRA_TITLE = "title";
    private static final String EXTRA_BODY = "body";

    private static final String KIND_ADHAN = "adhan";
    private static final String KIND_REMINDER = "reminder";
    private static final String KIND_PHASE = "phase";
    private static final String KIND_TIME = "time";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null || intent == null) {
            return;
        }

        final String action = intent.getAction();

        if (ACTION_STOP_ADHAN.equals(action)) {
            handleStopAdhan(context);
            return;
        }

        final String kind = intent.getStringExtra(EXTRA_KIND);

        if (kind == null || kind.trim().isEmpty()) {
            Log.w(TAG, "تم استقبال بث بدون نوع حدث صالح");
            return;
        }

        switch (kind) {
            case KIND_TIME:
                handleSilentTimeEvent(context);
                break;

            case KIND_ADHAN:
                handleAdhanEvent(context, intent);
                break;

            case KIND_REMINDER:
                handleReminderEvent(context, intent);
                break;

            case KIND_PHASE:
                handlePhaseEvent(context);
                break;

            default:
                Log.w(TAG, "نوع حدث غير معروف: " + kind);
                break;
        }
    }

    /* ========================== إيقاف الأذان ========================== */

    private void handleStopAdhan(Context context) {
        try {
            Intent serviceIntent =
                    new Intent(context, AdhanService.class);

            context.stopService(serviceIntent);

            NotificationHelper.cancelAdhanNotification(context);
            NotificationHelper.updatePersistent(context);

            AdhanScheduler.scheduleNextAdhan(context);

        } catch (Exception e) {
            Log.e(TAG, "خطأ في إيقاف الأذان وإعادة الجدولة", e);
        }
    }

    /* ======================== حدث منتصف الليل ======================== */

    /**
     * حدث صامت يُستخدم لتحديث التاريخ الهجري والإشعار الدائم،
     * دون تشغيل صوت أو إظهار إشعار جديد.
     */
    private void handleSilentTimeEvent(Context context) {
        try {
            NotificationHelper.updatePersistent(context);
        } catch (Exception e) {
            Log.e(TAG, "خطأ في تحديث الإشعار الدائم عند منتصف الليل", e);
        }
    }

    /* ============================ تشغيل الأذان ============================ */

    private void handleAdhanEvent(Context context, Intent intent) {
        final int id = intent.getIntExtra(EXTRA_ID, 0);
        final String title = intent.getStringExtra(EXTRA_TITLE);
        final String body = intent.getStringExtra(EXTRA_BODY);

        try {
            Intent serviceIntent =
                    new Intent(context, AdhanService.class);

            serviceIntent.putExtras(intent);

            ContextCompat.startForegroundService(
                    context,
                    serviceIntent
            );

        } catch (Exception e) {
            Log.e(TAG, "تعذر تشغيل خدمة الأذان، سيتم إظهار إشعار بديل", e);

            NotificationHelper.showReminder(
                    context,
                    id,
                    title != null ? title : "حان وقت الأذان",
                    body != null ? body : ""
            );
        }

        updatePersistentNotification(context);
    }

    /* ============================ إشعار تذكير ============================ */

    private void handleReminderEvent(Context context, Intent intent) {
        final int id = intent.getIntExtra(EXTRA_ID, 0);
        final String title = intent.getStringExtra(EXTRA_TITLE);
        final String body = intent.getStringExtra(EXTRA_BODY);

        try {
            NotificationHelper.showReminder(
                    context,
                    id,
                    title != null ? title : "اقتربت الصلاة",
                    body != null ? body : ""
            );
        } catch (Exception e) {
            Log.e(TAG, "خطأ في إظهار إشعار التذكير", e);
        }

        updatePersistentNotification(context);
    }

    /* ======================== تحديث الإشعار الدائم ======================== */

    private void handlePhaseEvent(Context context) {
        updatePersistentNotification(context);
    }

    private void updatePersistentNotification(Context context) {
        try {
            NotificationHelper.updatePersistent(context);
        } catch (Exception e) {
            Log.e(TAG, "خطأ في تحديث الإشعار الدائم", e);
        }
    }
}