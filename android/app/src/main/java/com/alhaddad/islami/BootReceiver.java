package com.alhaddad.islami;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * BootReceiver
 *
 * يستيقظ عند إعادة تشغيل الهاتف أو تحديث التطبيق أو تغيير الوقت/المنطقة الزمنية.
 * يقوم بإعادة جدولة جميع التنبيهات لضمان عدم تفويت أي صلاة.
 */
public final class BootReceiver extends BroadcastReceiver {

    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null || intent == null) {
            return;
        }

        String action = intent.getAction();

        if (action == null) {
            return;
        }

        // التحقق من سبب الاستيقاظ
        boolean isBoot = Intent.ACTION_BOOT_COMPLETED.equals(action);
        boolean isAppUpdate = Intent.ACTION_MY_PACKAGE_REPLACED.equals(action);
        boolean isTimeChange = Intent.ACTION_TIME_CHANGED.equals(action);
        boolean isTimezoneChange = Intent.ACTION_TIMEZONE_CHANGED.equals(action);

        if (!isBoot && !isAppUpdate && !isTimeChange && !isTimezoneChange) {
            return;
        }

        try {
            Log.i(TAG, "استيقظ مستقبل الإقلاع للسبب: " + action);

            // 1. التأكد من وجود قنوات الإشعارات
            NotificationHelper.ensureChannels(context);

            // 2. تحديث الإشعار الدائم
            NotificationHelper.updatePersistent(context);

            // 3. إعادة جدولة جميع التنبيهات المخزنة (مواقيت الصلاة)
            int scheduledCount = AdhanScheduler.scheduleAll(context);
            
            // ✅ 4. إعادة جدولة التذكيرات المفعلة (777 و 888) بعد الإقلاع
            AdhanScheduler.rescheduleAllReminders(context);
            
            Log.i(TAG, "تمت إعادة جدولة " + scheduledCount + " تنبيه + التذكيرات بنجاح");

        } catch (Exception e) {
            Log.e(TAG, "خطأ فادح أثناء إعادة الجدولة بعد الإقلاع", e);
        }
    }
}