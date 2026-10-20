package com.alhaddad.islami;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class NotificationHelper {

    public static final String CHANNEL_ID = "adhan_channel_id";
    public static final String CHANNEL_NAME = "أذان الصلاة";
    public static final int NOTIFICATION_ID = 1001;
    public static final int ID_PLAYING = 1002;

    public static final String PERSISTENT_CHANNEL_ID = "persistent_channel_id";
    public static final String PERSISTENT_CHANNEL_NAME = "مواقيت الصلاة";
    public static final int PERSISTENT_NOTIFICATION_ID = 9999;

    public static void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = context.getSystemService(NotificationManager.class);
            if (manager == null) return;

            NotificationChannel adhanChannel = new NotificationChannel(
                    CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_HIGH
            );
            adhanChannel.setSound(null, null);
            adhanChannel.enableVibration(true);
            manager.createNotificationChannel(adhanChannel);

            NotificationChannel persistentChannel = new NotificationChannel(
                    PERSISTENT_CHANNEL_ID, PERSISTENT_CHANNEL_NAME, NotificationManager.IMPORTANCE_LOW
            );
            persistentChannel.setDescription("يعرض الوقت المتبقي للصلاة القادمة والتاريخ الهجري");
            persistentChannel.setSound(null, null);
            persistentChannel.enableVibration(false);
            persistentChannel.setShowBadge(false);
            manager.createNotificationChannel(persistentChannel);
        }
    }

    public static void ensureChannels(Context context) {
        createNotificationChannel(context);
    }

    public static void updatePersistent(Context context) {
        try {
            long now = System.currentTimeMillis();
            long nextTime = Long.MAX_VALUE;
            String nextPrayerName = "";
            
            // جلب الصلاة القادمة من المخزن
            for (AdhanStore.Item it : AdhanStore.load(context)) {
                if (it.at > now && it.at < nextTime) {
                    nextTime = it.at;
                    nextPrayerName = it.prayer != null && !it.prayer.isEmpty() ? it.prayer : it.title;
                }
            }

            if (nextTime == Long.MAX_VALUE) return; // لا توجد صلاة قادمة

            // 1. التاريخ الهجري
            android.icu.util.IslamicCalendar hijriCal = new android.icu.util.IslamicCalendar();
            hijriCal.setTimeInMillis(now);
            SimpleDateFormat hijriFormat = new SimpleDateFormat("d MMMM yyyy", new Locale("ar"));
            hijriFormat.setCalendar(hijriCal);
            String hijriDate = hijriFormat.format(new Date());

            // 2. حساب العداد (موجب أو سالب)
            long diff = nextTime - now;
            boolean isUpcoming = diff > 0; // إذا كان الوقت لم يأت بعد (موجب)
            
            long hours = Math.abs(diff) / (1000 * 60 * 60);
            long minutes = (Math.abs(diff) / (1000 * 60)) % 60;
            long seconds = (Math.abs(diff) / 1000) % 60;
            
            String countdownText = String.format(Locale.getDefault(), "%02d:%02d:%02d", hours, minutes, seconds);
            String sign = isUpcoming ? "+" : "-"; // موجب للصلاة القادمة، سالب للوقت المنقضي

            // تنسيق وقت الصلاة
            SimpleDateFormat sdf = new SimpleDateFormat("hh:mm a", new Locale("ar"));
            String prayerTime = sdf.format(new Date(nextTime));

            Intent intent = new Intent(context, MainActivity.class);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, flags);

            // بناء نص الإشعار
            String titleText = "الصلاة القادمة: " + nextPrayerName;
            String bodyText = "الوقت المتبقي: " + sign + countdownText + " | " + hijriDate;

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, PERSISTENT_CHANNEL_ID)
                    .setContentTitle(titleText)
                    .setContentText(bodyText)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(bodyText + "\nموعد الأذان: " + prayerTime))
                    .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                    .setOngoing(true) // يجعله ثابتاً لا يمكن سحبه
                    .setAutoCancel(false)
                    .setOnlyAlertOnce(true) // لا يصدر صوتاً عند التحديث
                    .setPriority(NotificationCompat.PRIORITY_LOW)
                    .setContentIntent(pendingIntent);

            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.notify(PERSISTENT_NOTIFICATION_ID, builder.build());
            }

        } catch (Exception e) {
            Log.e("NotificationHelper", "خطأ في تحديث الإشعار الدائم", e);
        }
    }

    public static Notification buildPlaying(Context context, String title, String body) {
        Intent stopIntent = new Intent(context, AdhanReceiver.class);
        stopIntent.setAction("STOP_ADHAN_ACTION");
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent stopPendingIntent = PendingIntent.getBroadcast(context, 0, stopIntent, flags);

        Intent openAppIntent = new Intent(context, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        PendingIntent openAppPendingIntent = PendingIntent.getActivity(context, 0, openAppIntent, flags);

        return new NotificationCompat.Builder(context, CHANNEL_ID)
                .setContentTitle(title).setContentText(body)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setOngoing(true).setAutoCancel(false)
                .setContentIntent(openAppPendingIntent)
                .addAction(android.R.drawable.ic_media_pause, "إيقاف الأذان", stopPendingIntent)
                .build();
    }

    public static void showReminder(Context context, int id, String title, String body) {
        Intent intent = new Intent(context, MainActivity.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pendingIntent = PendingIntent.getActivity(context, id, intent, flags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setContentTitle(title).setContentText(body)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true).setPriority(NotificationCompat.PRIORITY_HIGH);

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.notify(id, builder.build());
    }

    public static void cancelAdhanNotification(Context context) {
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.cancel(NOTIFICATION_ID);
            notificationManager.cancel(ID_PLAYING);
        }
    }

    public static PendingIntent openApp(Context context) {
        Intent intent = new Intent(context, MainActivity.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(context, 0, intent, flags);
    }
}