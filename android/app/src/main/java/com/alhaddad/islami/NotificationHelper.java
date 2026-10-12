package com.alhaddad.islami;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.text.format.DateFormat;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import java.util.Date;

final class NotificationHelper {
    static final String CH_PERSISTENT = "adhan_persistent";
    static final String CH_PLAYING = "adhan_playing";
    static final String CH_REMINDER = "adhan_reminder";

    static final int BRAND_COLOR = 0xFF02634D; // أخضر التطبيق

    static final int ID_PERSISTENT = 9001;
    static final int ID_PLAYING = 9002;

    private NotificationHelper() {}

    static void ensureChannels(Context c) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null) return;

        NotificationChannel persistent = new NotificationChannel(
                CH_PERSISTENT, "الصلاة القادمة (دائم)", NotificationManager.IMPORTANCE_LOW);
        persistent.setShowBadge(false);
        persistent.setSound(null, null);
        persistent.setDescription("إشعار دائم يعرض الوقت المتبقي للصلاة القادمة");
        nm.createNotificationChannel(persistent);

        NotificationChannel playing = new NotificationChannel(
                CH_PLAYING, "تشغيل الأذان", NotificationManager.IMPORTANCE_LOW);
        playing.setSound(null, null);
        playing.setShowBadge(false);
        nm.createNotificationChannel(playing);

        NotificationChannel reminder = new NotificationChannel(
                CH_REMINDER, "تذكير قبل الأذان", NotificationManager.IMPORTANCE_HIGH);
        nm.createNotificationChannel(reminder);
    }

    static PendingIntent openApp(Context c) {
        Intent i = new Intent(c, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(c, 0, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    static String arabicName(String prayer) {
        if ("fajr".equals(prayer)) return "الفجر";
        if ("dhuhr".equals(prayer)) return "الظهر";
        if ("asr".equals(prayer)) return "العصر";
        if ("maghrib".equals(prayer)) return "المغرب";
        if ("isha".equals(prayer)) return "العشاء";
        return "";
    }

    /** إشعار الخدمة الأمامية أثناء تشغيل الأذان، مع زر «إيقاف الأذان». */
    static Notification buildPlaying(Context c, String title, String body) {
        ensureChannels(c);
        Intent stop = new Intent(c, AdhanService.class);
        stop.setAction(AdhanService.ACTION_STOP);
        PendingIntent stopPi = PendingIntent.getService(
                c, 1, stop, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        return new NotificationCompat.Builder(c, CH_PLAYING)
                .setSmallIcon(R.drawable.ic_stat_adhan)
                .setColor(BRAND_COLOR)
                .setContentTitle(title)
                .setContentText(body)
                .setOngoing(true)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(openApp(c))
                .addAction(0, "إيقاف الأذان", stopPi)
                .build();
    }

    @SuppressLint("MissingPermission")
    static void showReminder(Context c, int id, String title, String body) {
        ensureChannels(c);
        Notification n = new NotificationCompat.Builder(c, CH_REMINDER)
                .setSmallIcon(R.drawable.ic_stat_adhan)
                .setColor(BRAND_COLOR)
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(openApp(c))
                .build();
        try {
            NotificationManagerCompat.from(c).notify(id, n);
        } catch (SecurityException ignored) {
        }
    }

    /** الإشعار الدائم: الصلاة القادمة مع عدّاد تنازلي يعمل بدون تحديثات متكررة. */
    @SuppressLint("MissingPermission")
    static void updatePersistent(Context c) {
        NotificationManagerCompat nm = NotificationManagerCompat.from(c);
        if (!AdhanStore.isPersistent(c)) {
            nm.cancel(ID_PERSISTENT);
            return;
        }
        ensureChannels(c);

        AdhanStore.Item next = AdhanStore.nextAdhan(c, System.currentTimeMillis());
        String city = AdhanStore.city(c);
        String title;
        String text;
        NotificationCompat.Builder b = new NotificationCompat.Builder(c, CH_PERSISTENT)
                .setSmallIcon(R.drawable.ic_stat_adhan)
                .setColor(BRAND_COLOR)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setSilent(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_STATUS)
                .setContentIntent(openApp(c));

        if (next != null) {
            title = "الصلاة القادمة: " + arabicName(next.prayer);
            String time = DateFormat.getTimeFormat(c).format(new Date(next.at));
            text = city.isEmpty() ? time : time + " · " + city;
            b.setWhen(next.at).setShowWhen(true).setUsesChronometer(true).setChronometerCountDown(true);
        } else {
            title = "إسلامي";
            text = "افتح التطبيق لتحديث مواقيت الصلاة";
        }
        b.setContentTitle(title).setContentText(text);

        try {
            nm.notify(ID_PERSISTENT, b.build());
        } catch (SecurityException ignored) {
        }
    }
}
