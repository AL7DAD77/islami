package com.alhaddad.islami;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import androidx.core.content.ContextCompat;

/** يستقبل تنبيه النظام في وقت الأذان/التذكير حتى لو كان التطبيق مغلقاً. */
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
                // إن منع النظام بدء الخدمة (مثلاً بلا صلاحية المنبهات الدقيقة) نكتفي بإشعار بصوت النظام
                NotificationHelper.showReminder(context, id, title == null ? "حان وقت الأذان" : title, body == null ? "" : body);
            }
        } else {
            NotificationHelper.showReminder(context, id, title == null ? "اقتربت الصلاة" : title, body == null ? "" : body);
        }
        NotificationHelper.updatePersistent(context);
    }
}
