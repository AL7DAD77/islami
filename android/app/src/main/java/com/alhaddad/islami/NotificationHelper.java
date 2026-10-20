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
            persistentChannel.setDescription("يعرض الوقت المتبقي أو المنقضي للصلاة والتاريخ الهجري");
            persistentChannel.setSound(null, null);
            persistentChannel.enableVibration(false);
            persistentChannel.setShowBadge(false);
            manager.createNotificationChannel(persistentChannel);
        }
    }

    public static void ensureChannels(Context context) {
        createNotificationChannel(context);
    }

    private static String translatePrayer(String englishName) {
        if (englishName == null) return "";
        switch (englishName.toLowerCase()) {
            case "fajr": return "الفجر";
            case "sunrise": return "الشروق";
            case "dhuhr": return "الظهر";
            case "asr": return "العصر";
            case "maghrib": return "المغرب";
            case "isha": return "العشاء";
            default: return englishName;
        }
    }

    public static void updatePersistent(Context context) {
        try {
            long now = System.currentTimeMillis();
            
            long nextTime = Long.MAX_VALUE;
            long prevTime = Long.MIN_VALUE;
            String nextPrayerName = "";
            String prevPrayerName = "";

            for (AdhanStore.Item it : AdhanStore.load(context)) {
                String prayer = translatePrayer(it.prayer != null && !it.prayer.isEmpty() ? it.prayer : it.title);
                if (it.at > now && it.at < nextTime) {
                    nextTime = it.at;
                    nextPrayerName = prayer;
                } else if (it.at <= now && it.at > prevTime) {
                    prevTime = it.at;
                    prevPrayerName = prayer;
                }
            }

            String titleText = "";
            String timeText = "";
            String sign = "";

            if (nextTime != Long.MAX_VALUE && (prevTime == Long.MIN_VALUE || (nextTime - now) < (now - prevTime))) {
                long diff = nextTime - now;
                long hours = diff / (1000 * 60 * 60);
                long minutes = (diff / (1000 * 60)) % 60;
                
                if (hours > 0) {
                    timeText = String.format(Locale.getDefault(), "%d ساعة و %d دقيقة", hours, minutes);
                } else {
                    timeText = String.format(Locale.getDefault(), "%d دقيقة", minutes);
                }
                sign = "-";
                titleText = "متبقي على " + nextPrayerName;
            } 
            else if (prevTime != Long.MIN_VALUE) {
                long diff = now - prevTime;
                long hours = diff / (1000 * 60 * 60);
                long minutes = (diff / (1000 * 60)) % 60;
                
                if (hours > 0) {
                    timeText = String.format(Locale.getDefault(), "%d ساعة و %d دقيقة", hours, minutes);
                } else {
                    timeText = String.format(Locale.getDefault(), "%d دقيقة", minutes);
                }
                sign = "+";
                titleText = "مضى على " + prevPrayerName;
            } else {
                return;
            }

            // ⚠️ الحل الجذري للتاريخ الهجري (يدوي لضمان عدم ظهور أي كلمات إنجليزية)
            String hijriDate = "";
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                android.icu.util.IslamicCalendar hijriCal = new android.icu.util.IslamicCalendar();
                hijriCal.setTimeInMillis(now);
                int day = hijriCal.get(android.icu.util.Calendar.DAY_OF_MONTH);
                int month = hijriCal.get(android.icu.util.Calendar.MONTH);
                int year = hijriCal.get(android.icu.util.Calendar.YEAR);
                
                String[] hijriMonths = {"محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"};
                hijriDate = day + " " + hijriMonths[month] + " " + year + " هـ";
            } else {
                hijriDate = new SimpleDateFormat("dd/MM/yyyy", new Locale("ar")).format(new Date(now));
            }

            SimpleDateFormat sdf = new SimpleDateFormat("hh:mm a", new Locale("ar"));
            String prayerTimeStr = nextTime != Long.MAX_VALUE ? sdf.format(new Date(nextTime)) : "";

            Intent intent = new Intent(context, MainActivity.class);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, flags);

            String bodyText = "الوقت: " + sign + timeText;
            String bigText = bodyText + "\n" + hijriDate + (nextTime != Long.MAX_VALUE ? "\nموعد الأذان: " + prayerTimeStr : "");

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, PERSISTENT_CHANNEL_ID)
                    .setContentTitle(titleText)
                    .setContentText(bodyText)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(bigText))
                    .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                    .setOngoing(true)
                    .setAutoCancel(false)
                    .setOnlyAlertOnce(true)
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