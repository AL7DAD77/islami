package com.alhaddad.islami;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import androidx.core.content.ContextCompat;

/**
 * يستقبل كل تنبيهات النظام المجدولة، حتى والتطبيق مغلق:
 * - adhan: يشغّل صوت الأذان في خدمة أمامية
 * - reminder: إشعار التذكير قبل الصلاة
 * - time / phase: لا تنبيه، فقط تحديث العداد والتاريخ في الإشعار الدائم
 */
public class AdhanReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
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
        // في كل الحالات: حدّث الإشعار الدائم (العداد يتحول من (+) إلى (-) أو يبدأ وقتاً جديداً)
        NotificationHelper.updatePersistent(context);
    }
}
