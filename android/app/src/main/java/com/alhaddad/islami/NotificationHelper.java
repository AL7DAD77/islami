package com.alhaddad.islami;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public final class NotificationHelper {

    private static final String TAG = "NotificationHelper";

    /* ============================== الثوابت ============================== */

    // قناة الأذان (بدون صوت، الصوت عبر الخدمة)
    public static final String CHANNEL_ID = "adhan_channel_id";
    public static final String CHANNEL_NAME = "أذان الصلاة";

    // قناة الإشعار الدائم (صامتة)
    public static final String PERSISTENT_CHANNEL_ID = "persistent_channel_id";
    public static final String PERSISTENT_CHANNEL_NAME = "مواقيت الصلاة";

    // ✅ قناة التذكيرات (بصوت واهتزاز - للصلاة على النبي والأذكار)
    public static final String REMINDER_CHANNEL_ID = "reminder_channel_id";
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

        // 1. قناة الأذان
        NotificationChannel adhanChannel = new NotificationChannel(
                CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_HIGH
        );
        adhanChannel.setDescription("إشعارات الأذان والتذكيرات المهمة");
        adhanChannel.setSound(null, null);
        adhanChannel.enableVibration(true);
        adhanChannel.setVibrationPattern(new long[]{0, 400, 250, 400});
        adhanChannel.enableLights(true);
        adhanChannel.setLightColor(APP_COLOR);
        manager.createNotificationChannel(adhanChannel);

        // 2. قناة الإشعار الدائم
        NotificationChannel persistentChannel = new NotificationChannel(
                PERSISTENT_CHANNEL_ID, PERSISTENT_CHANNEL_NAME, NotificationManager.IMPORTANCE_LOW
        );
        persistentChannel.setDescription("يعرض الوقت المتبقي للصلاة والتاريخ الهجري");
        persistentChannel.setSound(null, null);
        persistentChannel.enableVibration(false);
        persistentChannel.setShowBadge(false);
        manager.createNotificationChannel(persistentChannel);

        // 3. ✅ قناة التذكيرات (جديدة) - تصدر صوتاً لتنبيه المستخدم
        NotificationChannel reminderChannel = new NotificationChannel(
                REMINDER_CHANNEL_ID, REMINDER_CHANNEL_NAME, NotificationManager.IMPORTANCE_DEFAULT
        );
        reminderChannel.setDescription("إشعارات التذكير بالأذكار والصلاة على النبي");
        reminderChannel.enableVibration(true);
        reminderChannel.setVibrationPattern(new long[]{0, 300, 200, 300});
        manager.createNotificationChannel(reminderChannel);
    }

    /* ======================= الإشعار الدائم للمواقيت ======================= */

    public static void updatePersistent(Context context) {
        try {
            long now = System.currentTimeMillis();
            PrayerTime next = findNextPrayer(context, now);
            PrayerTime previous = findPreviousPrayer(context, now);

            if (next == null && previous == null) return;

            boolean showNext = next != null && (previous == null || next.at - now <= now - previous.at);
            String title;
            String timeText;
            String sign;

            if (showNext) {
                timeText = formatTimeDiff(next.at - now);
                sign = "- ";
                title = "متبقي على " + next.name;
            } else {
                timeText = formatTimeDiff(now - previous.at);
                sign = "+ ";
                title = "مضى على " + previous.name;
            }

            String body = "الوقت: " + sign + timeText;
            String hijriDate = getHijriDate(now);

            StringBuilder bigText = new StringBuilder();
            bigText.append(body).append("\n").append(hijriDate);

            if (showNext) {
                bigText.append("\nموعد الأذان: ").append(formatTime(next.at));
            }

            Notification notification = new NotificationCompat.Builder(context, PERSISTENT_CHANNEL_ID)
                    .setContentTitle(title)
                    .setContentText(body)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(bigText.toString()))
                    .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                    .setLargeIcon(getAppIcon(context))
                    .setColor(APP_COLOR)
                    .setOngoing(true)
                    .setAutoCancel(false)
                    .setOnlyAlertOnce(true)
                    .setPriority(NotificationCompat.PRIORITY_LOW)
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
                context, AdhanReceiver.class, AdhanReceiver.ACTION_STOP_ADHAN, 0
        );

        PendingIntent openAppIntent = createActivityPendingIntent(
                context, MainActivity.class, 0, true
        );

        return new NotificationCompat.Builder(context, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setLargeIcon(getAppIcon(context))
                .setColor(APP_COLOR)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setOngoing(true)
                .setAutoCancel(false)
                .setContentIntent(openAppIntent)
                .addAction(android.R.drawable.ic_media_pause, "إيقاف الأذان", stopIntent)
                .build();
    }

    /* ========================= إشعارات التذكير ========================= */

    public static void showReminder(Context context, int id, String title, String body) {
        // ✅ نستخدم قناة التذكيرات الجديدة لكي يصدر صوت التنبيه
        Notification notification = new NotificationCompat.Builder(context, REMINDER_CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setLargeIcon(getAppIcon(context))
                .setColor(APP_COLOR)
                .setContentIntent(openApp(context, id))
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
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
            if (!isValidPrayerItem(item) || item.at <= now) continue;
            if (next == null || item.at < next.at) {
                next = new PrayerTime(translatePrayer(item.prayer), item.at);
            }
        }
        return next;
    }

    private static PrayerTime findPreviousPrayer(Context context, long now) {
        PrayerTime previous = null;
        for (AdhanStore.Item item : AdhanStore.load(context)) {
            if (!isValidPrayerItem(item) || item.at > now) continue;
            if (previous == null || item.at > previous.at) {
                previous = new PrayerTime(translatePrayer(item.prayer), item.at);
            }
        }
        return previous;
    }

    private static boolean isValidPrayerItem(AdhanStore.Item item) {
        return item != null && item.prayer != null && !item.prayer.trim().isEmpty() && item.at > 0;
    }

    private static String translatePrayer(String englishName) {
        if (englishName == null || englishName.trim().isEmpty()) return "";
        switch (englishName.toLowerCase(Locale.US)) {
            case "fajr": return "الفجر";
            case "sunrise": return "الشروق";
            case "dhuhr": return "الظهر";
            case "asr": return "العصر";
            case "maghrib": return "المغرب";
            case "isha": return "العشاء";
            case "salawat": return "الصلاة على النبي ﷺ";
            case "adhkar": return "أذكارك اليومية";
            default: return englishName;
        }
    }

    private static String formatTimeDiff(long diffMs) {
        if (diffMs < MINUTE_MS) return "أقل من دقيقة";
        long hours = diffMs / HOUR_MS;
        long minutes = (diffMs % HOUR_MS) / MINUTE_MS;
        StringBuilder result = new StringBuilder();

        if (hours > 0) result.append(formatUnit(hours, "ساعة", "ساعتان", "ساعات"));
        if (minutes > 0) {
            if (result.length() > 0) result.append(" و ");
            result.append(formatUnit(minutes, "دقيقة", "دقيقتان", "دقائق"));
        }
        return result.toString();
    }

    private static String formatUnit(long value, String singular, String dual, String plural) {
        if (value == 1) return singular;
        if (value == 2) return dual;
        if (value >= 3 && value <= 10) return value + " " + plural;
        return value + " " + singular;
    }

    private static String formatTime(long timeMs) {
        String time = new SimpleDateFormat("hh:mm a", Locale.US).format(new Date(timeMs));
        return time.replace("AM", "ص").replace("PM", "م");
    }

    private static String getHijriDate(long timeMs) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            return new SimpleDateFormat("dd/MM/yyyy", new Locale("ar")).format(new Date(timeMs));
        }
        try {
            android.icu.util.IslamicCalendar calendar = new android.icu.util.IslamicCalendar();
            calendar.setTimeInMillis(timeMs);
            int day = calendar.get(android.icu.util.Calendar.DAY_OF_MONTH);
            int month = calendar.get(android.icu.util.Calendar.MONTH);
            int year = calendar.get(android.icu.util.Calendar.YEAR);
            return day + " " + getHijriMonthName(month) + " " + year + " هـ";
        } catch (Exception e) {
            return new SimpleDateFormat("dd/MM/yyyy", new Locale("ar")).format(new Date(timeMs));
        }
    }

    private static String getHijriMonthName(int month) {
        String[] months = {"محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"};
        if (month < 0 || month >= months.length) return "";
        return months[month];
    }

    private static android.graphics.Bitmap getAppIcon(Context context) {
        return BitmapFactory.decodeResource(context.getResources(), R.mipmap.ic_launcher);
    }

    private static NotificationManager getNotificationManager(Context context) {
        return (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
    }

    private static void notifySafely(Context context, int id, Notification notification) {
        NotificationManager manager = getNotificationManager(context);
        if (manager != null) manager.notify(id, notification);
    }

    private static PendingIntent openApp(Context context, int requestCode) {
        return createActivityPendingIntent(context, MainActivity.class, requestCode, false);
    }

    private static PendingIntent createActivityPendingIntent(Context context, Class<?> activityClass, int requestCode, boolean clearTask) {
        Intent intent = new Intent(context, activityClass);
        if (clearTask) {
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        }
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(context, requestCode, intent, flags);
    }

    private static PendingIntent createBroadcastPendingIntent(Context context, Class<?> receiverClass, String action, int requestCode) {
        Intent intent = new Intent(context, receiverClass);
        intent.setAction(action);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(context, requestCode, intent, flags);
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