package com.alhaddad.islami;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import androidx.core.app.NotificationCompat;

public class PreAdhanReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) {
            return;
        }

        int id = intent.getIntExtra("id", 0);
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");

        if (title == null) title = "تنبيه قبل الأذان";
        if (body == null) body = "";

        // ✅ التأكد من إنشاء القناة الجديدة (الصوتية)
        PreAdhanScheduler.createNotificationChannel(context);

        // ✅ إضافة Intent لفتح التطبيق عند الضغط على الإشعار
        Intent openIntent = new Intent(context, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentIntent = PendingIntent.getActivity(
                context,
                id,
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification notification = new NotificationCompat.Builder(
                context,
                PreAdhanScheduler.PRE_ADHAN_CHANNEL_ID
        )
                // ✅ استخدام أيقونة التطبيق بدلاً من أيقونة النظام
                .setSmallIcon(R.drawable.ic_stat_adhan)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(contentIntent) // ✅ فتح التطبيق عند الضغط
                // ✅ إزالة setSound(null) للسماح للقناة بالصوت
                .build();

        NotificationManager manager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        if (manager != null) {
            manager.notify(id, notification);
        }
    }
}