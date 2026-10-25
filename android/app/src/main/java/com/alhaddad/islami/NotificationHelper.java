package com.alhaddad.islami;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public final class NotificationHelper {

    private static final String TAG = "NotificationHelper";

    /* ============================== الثوابت ============================== */

    public static final String CHANNEL_ID = "adhan_channel_id";
    public static final String CHANNEL_NAME = "أذان الصلاة";

    public static final String PERSISTENT_CHANNEL_ID = "persistent_channel_id";
    public static final String PERSISTENT_CHANNEL_NAME = "مواقيت الصلاة";

    public static final String REMINDER_CHANNEL_ID = "reminder_channel_v4";
    public static final String REMINDER_CHANNEL_NAME = "تذكيرات الأذكار والصلاة على النبي";

    public static final int NOTIFICATION_ID = 1001;
    public static final int ID_PLAYING = 1002;
    public static final int PERSISTENT_NOTIFICATION_ID = 9999;

    private static final int APP_COLOR = Color.parseColor("#0A1F1A");
    private static final long MINUTE_MS = 60_000L;
    private static final long HOUR_MS = 60 * MINUTE_MS;

    private NotificationHelper() {}

    /* ========================== قنوات الإشعارات ========================== */

    public static void ensureChannels(Context context) {
        createNotificationChannel(context);
    }

    public static void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null) return;

        // قناة الأذان
        NotificationChannel adhanChannel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
        );

        adhanChannel.setDescription("إشعارات الأذان والتذكيرات المهمة");
        adhanChannel.enableVibration(true);
        adhanChannel.setVibrationPattern(new long[]{0, 500, 300, 500});
        adhanChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        adhanChannel.setSound(null, null);

        manager.createNotificationChannel(adhanChannel);

        // قناة الإشعار الدائم
        NotificationChannel persistentChannel = new NotificationChannel(
                PERSISTENT_CHANNEL_ID,
                PERSISTENT_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
        );

        persistentChannel.setDescription("يعرض الوقت المتبقي للصلاة والتاريخ الهجري");
        persistentChannel.setSound(null, null);
        persistentChannel.enableVibration(false);
        persistentChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

        manager.createNotificationChannel(persistentChannel);

        // قناة التذكيرات
        NotificationChannel reminderChannel = new NotificationChannel(
                REMINDER_CHANNEL_ID,
                REMINDER_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
        );

        reminderChannel.setDescription("إشعارات التذكير بالأذكار والصلاة على النبي");
        reminderChannel.enableVibration(true);
        reminderChannel.setVibrationPattern(new long[]{0, 400, 250, 400});
        reminderChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

        AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .build();

        reminderChannel.setSound(
                Settings.System.DEFAULT_NOTIFICATION_URI,
                audioAttributes
        );

        manager.createNotificationChannel(reminderChannel);
    }

    /* ======================= الإشعار الدائم للمواقيت ======================= */

    public static void updatePersistent(Context context) {
        try {
            long now = System.currentTimeMillis();

            PrayerTime next = findNextPrayer(context, now);
            PrayerTime previous = findPreviousPrayer(context, now);

            if (next == null && previous == null) return;

            boolean showNext =
                    next != null &&
                    (previous == null || next.at - now <= now - previous.at);

            String title = showNext
                    ? "متبقي على " + next.name
                    : "مضى على " + previous.name;

            String body = showNext
                    ? "الوقت المتبقي: " + formatTimeDiff(next.at - now)
                    : "الوقت الماضي: " + formatTimeDiff(now - previous.at);

            Notification notification = new NotificationCompat.Builder(
                    context,
                    PERSISTENT_CHANNEL_ID
            )
                    .setContentTitle(title)
                    .setContentText(body)
                    .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                    .setLargeIcon(getAppIcon(context))
                    .setColor(APP_COLOR)
                    .setOngoing(true)
                    .setOnlyAlertOnce(true)
                    .setPriority(NotificationCompat.PRIORITY_LOW)
                    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                    .setContentIntent(openApp(context, 0))
                    .build();

            notifySafely(context, PERSISTENT_NOTIFICATION_ID, notification);

        } catch (Exception e) {
            Log.e(TAG, "خطأ في تحديث الإشعار الدائم", e);
        }
    }

    /* ========================== إشعار الأذان ========================== */

    public static Notification buildPlaying(Context context, String title, String body) {
        PendingIntent stopIntent = createBroadcastPendingIntent(
                context,
                AdhanReceiver.class,
                AdhanReceiver.ACTION_STOP_ADHAN,
                0
        );

        PendingIntent openAppIntent = createActivityPendingIntent(
                context,
                MainActivity.class,
                0,
                true
        );

        return new NotificationCompat.Builder(context, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setLargeIcon(getAppIcon(context))
                .setColor(APP_COLOR)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setAutoCancel(false)
                .setContentIntent(openAppIntent)
                .addAction(
                        android.R.drawable.ic_media_pause,
                        "إيقاف الأذان",
                        stopIntent
                )
                .build();
    }

    /* ========================= إشعارات التذكير ========================= */

    public static void showReminder(Context context, int id, String title, String body) {
        Notification notification = new NotificationCompat.Builder(
                context,
                REMINDER_CHANNEL_ID
        )
                .setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setLargeIcon(getAppIcon(context))
                .setColor(APP_COLOR)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setContentIntent(openApp(context, id))
                .build();

        notifySafely(context, id, notification);
    }

    public static void cancelAdhanNotification(Context context) {
        NotificationManager manager = getNotificationManager(context);

        if (manager != null) {
            manager.cancel(NOTIFICATION_ID);
            manager.cancel(ID_PLAYING);
        }
    }

    /* ============================ دوال مساعدة ============================ */

    private static PrayerTime findNextPrayer(Context context, long now) {
        PrayerTime next = null;

        for (AdhanStore.Item item : AdhanStore.load(context)) {
            if (item != null && item.at > now) {
                if (next == null || item.at < next.at) {
                    next = new PrayerTime(
                            translatePrayer(item.prayer),
                            item.at
                    );
                }
            }
        }

        return next;
    }

    private static PrayerTime findPreviousPrayer(Context context, long now) {
        PrayerTime previous = null;

        for (AdhanStore.Item item : AdhanStore.load(context)) {
            if (item != null && item.at <= now) {
                if (previous == null || item.at > previous.at) {
                    previous = new PrayerTime(
                            translatePrayer(item.prayer),
                            item.at
                    );
                }
            }
        }

        return previous;
    }

    private static String translatePrayer(String englishName) {
        if (englishName == null) return "";

        switch (englishName.toLowerCase(Locale.US)) {
            case "fajr":
                return "الفجر";

            case "sunrise":
                return "الشروق";

            case "dhuhr":
                return "الظهر";

            case "asr":
                return "العصر";

            case "maghrib":
                return "المغرب";

            case "isha":
                return "العشاء";

            default:
                return englishName;
        }
    }

    private static String formatTimeDiff(long diffMs) {
        long hours = diffMs / HOUR_MS;
        long minutes = (diffMs % HOUR_MS) / MINUTE_MS;

        if (hours > 0) {
            return hours + " ساعة و " + minutes + " دقيقة";
        }

        return minutes + " دقيقة";
    }

    private static android.graphics.Bitmap getAppIcon(Context context) {
        return BitmapFactory.decodeResource(
                context.getResources(),
                R.mipmap.ic_launcher
        );
    }

    private static NotificationManager getNotificationManager(Context context) {
        return (NotificationManager) context.getSystemService(
                Context.NOTIFICATION_SERVICE
        );
    }

    private static void notifySafely(
            Context context,
            int id,
            Notification notification
    ) {
        try {
            NotificationManagerCompat manager =
                    NotificationManagerCompat.from(context);

            if (!manager.areNotificationsEnabled()) {
                Log.w(
                        TAG,
                        "الإشعارات غير مفعلة من إعدادات النظام، لن يظهر الإشعار."
                );
                return;
            }

            manager.notify(id, notification);

        } catch (SecurityException e) {
            Log.e(
                    TAG,
                    "لم يتم منح إذن POST_NOTIFICATIONS، لن يظهر الإشعار.",
                    e
            );
        } catch (Exception e) {
            Log.e(TAG, "خطأ أثناء عرض الإشعار", e);
        }
    }

    public static PendingIntent openApp(Context context, int requestCode) {
        return createActivityPendingIntent(
                context,
                MainActivity.class,
                requestCode,
                false
        );
    }

    private static PendingIntent createActivityPendingIntent(
            Context context,
            Class<?> activityClass,
            int requestCode,
            boolean clearTask
    ) {
        Intent intent = new Intent(context, activityClass);

        if (clearTask) {
            intent.setFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK |
                    Intent.FLAG_ACTIVITY_CLEAR_TASK
            );
        }

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        return PendingIntent.getActivity(
                context,
                requestCode,
                intent,
                flags
        );
    }

    private static PendingIntent createBroadcastPendingIntent(
            Context context,
            Class<?> receiverClass,
            String action,
            int requestCode
    ) {
        Intent intent = new Intent(context, receiverClass);
        intent.setAction(action);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        return PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                flags
        );
    }

    private static final class PrayerTime {
        final String name;
        final long at;

        PrayerTime(String name, long at) {
            this.name = name;
            this.at = at;
        }
    }
}