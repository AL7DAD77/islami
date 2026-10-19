package com.alhaddad.islami;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import androidx.core.content.ContextCompat;

/**
 * يستقبل كل تنبيهات النظام المجدولة، حتى والتطبيق مغلق:
 * - adhan: يشغّل صوت الأذان في خدمة أمامية
 * - reminder: إشعار التذكير قبل الصلاة
 * - time / phase: لا تنبيه، فقط تحديث العداد والتاريخ في الإشعار الدائم
 * - STOP_ADHAN_ACTION: لإيقاف صوت الأذان وإخفاء الإشعار عند الضغط على الزر
 */
public class AdhanReceiver extends BroadcastReceiver {
    private static final String TAG = "AdhanReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();

        // 1. التحقق مما إذا كان هذا الأمر هو إيقاف الأذان (من زر الإشعار)
        if ("STOP_ADHAN_ACTION".equals(action)) {
            // إيقاف خدمة الأذان (الصوت)
            Intent serviceIntent = new Intent(context, AdhanService.class);
            context.stopService(serviceIntent);
            
            // إخفاء الإشعار المستمر
            NotificationHelper.cancelAdhanNotification(context);
            
            // ⚠️ الأهم: إعادة جدولة الأذان القادم لضمان استمرار عمل المنبهات
            try {
                // تأكد من أن هذا الكلاس موجود في مشروعك
                AdhanScheduler.scheduleNextAdhan(context);
            } catch (Exception e) {
                Log.e(TAG, "خطأ في إعادة الجدولة بعد الإيقاف", e);
            }
            
            return; // إنهاء الدالة هنا حتى لا يكمل للأسفل
        }

        // 2. الكود الأصلي الخاص بك لاستقبال أوامر التشغيل
        String kind = intent.getStringExtra("kind");
        int id = intent.getIntExtra("id", 0);
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");

        if ("adhan".equals(kind)) {
            try {
                Intent svc = new Intent(context, AdhanService.class);
                svc.putExtras(intent);
                ContextCompat.startForegroundService(context, svc);
            } catch (Exception e) {
                NotificationHelper.showReminder(context, id,
                        title == null ? "حان وقت الأذان" : title, body == null ? "" : body);
            }
        } else if ("reminder".equals(kind)) {
            NotificationHelper.showReminder(context, id,
                    title == null ? "اقتربت الصلاة" : title, body == null ? "" : body);
        }
        
        // في كل الحالات: حدّث الإشعار الدائم
        NotificationHelper.updatePersistent(context);
    }
}