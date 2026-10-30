package com.alhaddad.islami;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.SystemClock;
import android.util.Log;
import android.widget.RemoteViews;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public final class NotificationHelper {

    private static final String TAG = "NotificationHelper";
    private static final String PREFS_NAME = "IslamiSettings";

    public static final String CHANNEL_ID = "adhan_channel_id";
    public static final String CHANNEL_NAME = "أذان الصلاة";
    public static final String PERSISTENT_CHANNEL_ID = "persistent_channel_id";
    public static final String PERSISTENT_CHANNEL_NAME = "مواقيت الصلاة";
    
    // قنوات التذكيرات (3 أصوات × مهتز/صامت)
    public static final String REMINDER_CHANNEL_1 = "reminder_channel_v6_1";
    public static final String REMINDER_CHANNEL_2 = "reminder_channel_v6_2";
    public static final String REMINDER_CHANNEL_3 = "reminder_channel_v6_3";
    
    public static final String REMINDER_CHANNEL_SILENT_1 = "reminder_channel_v6_silent_1";
    public static final String REMINDER_CHANNEL_SILENT_2 = "reminder_channel_v6_silent_2";
    public static final String REMINDER_CHANNEL_SILENT_3 = "reminder_channel_v6_silent_3";

    public static final String REMINDER_CHANNEL_NAME = "تذكيرات الأذكار والصلاة على النبي";

    public static final int NOTIFICATION_ID = 1001;
    public static final int ID_PLAYING = 1002;
    public static final int PERSISTENT_NOTIFICATION_ID = 9999;

    private static final int APP_COLOR = Color.parseColor("#0A1F1A");

    private NotificationHelper() {}

    public static void ensureChannels(Context context) {
        createNotificationChannel(context);
    }

    public static void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null) return;

        NotificationChannel adhanChannel = new NotificationChannel(CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_HIGH);
        adhanChannel.setDescription("إشعارات الأذان والتذكيرات المهمة");
        adhanChannel.enableVibration(true);
        adhanChannel.setSound(null, null);
        manager.createNotificationChannel(adhanChannel);

        NotificationChannel persistentChannel = new NotificationChannel(PERSISTENT_CHANNEL_ID, PERSISTENT_CHANNEL_NAME, NotificationManager.IMPORTANCE_LOW);
        persistentChannel.setDescription("يعرض الوقت المتبقي للصلاة والتاريخ الهجري");
        persistentChannel.setSound(null, null);
        persistentChannel.enableVibration(false);
        manager.createNotificationChannel(persistentChannel);

        AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .build();

        // روابط الأصوات الثلاثة
        Uri sound1 = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + context.getPackageName() + "/" + R.raw.salawat_voice);
        Uri sound2 = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + context.getPackageName() + "/" + R.raw.salawat_voice_2);
        Uri sound3 = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + context.getPackageName() + "/" + R.raw.salawat_voice_3);

        // إنشاء القنوات المهتزة
        createReminderChannel(manager, REMINDER_CHANNEL_1, "تذكير (صوت 1)", sound1, audioAttributes, true);
        createReminderChannel(manager, REMINDER_CHANNEL_2, "تذكير (صوت 2)", sound2, audioAttributes, true);
        createReminderChannel(manager, REMINDER_CHANNEL_3, "تذكير (صوت 3)", sound3, audioAttributes, true);

        // إنشاء القنوات الصامتة
        createReminderChannel(manager, REMINDER_CHANNEL_SILENT_1, "تذكير صامت (صوت 1)", sound1, audioAttributes, false);
        createReminderChannel(manager, REMINDER_CHANNEL_SILENT_2, "تذكير صامت (صوت 2)", sound2, audioAttributes, false);
        createReminderChannel(manager, REMINDER_CHANNEL_SILENT_3, "تذكير صامت (صوت 3)", sound3, audioAttributes, false);
    }

    private static void createReminderChannel(NotificationManager manager, String id, String name, Uri sound, AudioAttributes attr, boolean vibrate) {
        NotificationChannel channel = new NotificationChannel(id, name, NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("نغمة التذكير المختارة");
        channel.enableVibration(vibrate);
        channel.setSound(sound, attr);
        manager.createNotificationChannel(channel);
    }

    /* ======================= الإشعار الدائم ======================= */

    public static void updatePersistent(Context context) {
        try {
            boolean isEnabled = AdhanStore.isPersistent(context);
            NotificationManagerCompat manager = NotificationManagerCompat.from(context);
            
            if (!isEnabled) {
                manager.cancel(PERSISTENT_NOTIFICATION_ID);
                return; 
            }

            long now = System.currentTimeMillis();
            long elapsedRealtime = SystemClock.elapsedRealtime();

            PrayerTime next = findNextPrayer(context, now);
            PrayerTime previous = findPreviousPrayer(context, now);

            if (next == null && previous == null) return;

            boolean showNext = next != null && (previous == null || next.at - now <= now - previous.at);
            
            String title = "إسلامي | " + getHijriDate(now);
            String body = showNext ? "متبقي على " + next.name + " " + formatTime(next.at) 
                                   : "مضى على " + previous.name + " " + formatTime(previous.at);

            RemoteViews expandedView = new RemoteViews(context.getPackageName(), R.layout.notif_persistent);
            
            if (showNext) {
                expandedView.setTextViewText(R.id.notif_prayer_name, next.name);
                expandedView.setTextViewText(R.id.notif_prayer_time, formatTime(next.at));
            } else {
                expandedView.setTextViewText(R.id.notif_prayer_name, previous.name);
                expandedView.setTextViewText(R.id.notif_prayer_time, formatTime(previous.at));
            }

            long targetTime = showNext ? next.at : previous.at;
            long timeDiff = showNext ? (targetTime - now) : (now - targetTime);
            long chronometerBase = showNext ? (elapsedRealtime + timeDiff) : (elapsedRealtime - timeDiff);

            expandedView.setChronometerCountDown(R.id.notif_chronometer, showNext);
            expandedView.setChronometer(R.id.notif_chronometer, chronometerBase, null, true);

            try {
                if (next != null && previous != null) {
                    long totalInterval = next.at - previous.at;
                    long elapsed = now - previous.at;
                    int progress = (int) ((elapsed * 100) / totalInterval);
                    expandedView.setProgressBar(R.id.notif_progress_bar, 100, showNext ? (100 - progress) : progress, false);
                }
            } catch (Exception e) {
                Log.e(TAG, "خطأ في شريط التقدم، سيتم تجاهله", e);
            }

            Notification notification = new NotificationCompat.Builder(context, PERSISTENT_CHANNEL_ID)
                    .setSmallIcon(android.R.drawable.ic_lock_idle_alarm) 
                    .setContentTitle(title)
                    .setContentText(body)
                    .setLargeIcon(getAppIcon(context))
                    .setColor(APP_COLOR)
                    .setOngoing(true) 
                    .setOnlyAlertOnce(true)
                    .setPriority(NotificationCompat.PRIORITY_LOW)
                    .setContentIntent(openApp(context, 0))
                    .setCustomBigContentView(expandedView)
                    .setStyle(new NotificationCompat.DecoratedCustomViewStyle())
                    .build();

            notifySafely(context, PERSISTENT_NOTIFICATION_ID, notification);

        } catch (Exception e) {
            Log.e(TAG, "خطأ في تحديث الإشعار الدائم", e);
        }
    }

    /* ========================== إشعار الأذان ========================== */

    public static Notification buildPlaying(Context context, String title, String body) {
        PendingIntent stopIntent = PendingIntent.getBroadcast(context, 0, 
            new Intent(context, AdhanReceiver.class).setAction(AdhanReceiver.ACTION_STOP_ADHAN), 
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0));
            
        PendingIntent openAppIntent = openApp(context, 0);

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
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean vibrationEnabled = prefs.getBoolean("vibration_enabled", true);
        String soundId = prefs.getString("salawat_sound_id", "1");

        // اختيار القناة المناسبة حسب الصوت والاهتزاز
        String channelToUse = REMINDER_CHANNEL_1; // الافتراضي
        if (soundId.equals("2")) channelToUse = vibrationEnabled ? REMINDER_CHANNEL_2 : REMINDER_CHANNEL_SILENT_2;
        else if (soundId.equals("3")) channelToUse = vibrationEnabled ? REMINDER_CHANNEL_3 : REMINDER_CHANNEL_SILENT_3;
        else channelToUse = vibrationEnabled ? REMINDER_CHANNEL_1 : REMINDER_CHANNEL_SILENT_1;

        Notification notification = new NotificationCompat.Builder(context, channelToUse)
                .setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(android.R.drawable.ic_dialog_info) 
                .setLargeIcon(getAppIcon(context))
                .setColor(APP_COLOR)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(openApp(context, id))
                .build();

        notifySafely(context, id, notification);
    }

    public static void cancelAdhanNotification(Context context) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.cancel(NOTIFICATION_ID);
            manager.cancel(ID_PLAYING);
        }
    }

    /* ============================ دوال مساعدة ============================ */

    private static boolean isValidPrayerItem(AdhanStore.Item item) {
        if (item == null || item.prayer == null) return false;
        String p = item.prayer.toLowerCase(Locale.US);
        return p.equals("fajr") || p.equals("dhuhr") || p.equals("asr") || p.equals("maghrib") || p.equals("isha");
    }

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

    private static String translatePrayer(String englishName) {
        if (englishName == null) return "";
        switch (englishName.toLowerCase(Locale.US)) {
            case "fajr": return "الفجر";
            case "sunrise": return "الشروق";
            case "dhuhr": return "الظهر";
            case "asr": return "العصر";
            case "maghrib": return "المغرب";
            case "isha": return "العشاء";
            default: return englishName;
        }
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
        try {
            return BitmapFactory.decodeResource(context.getResources(), R.mipmap.ic_launcher);
        } catch (Exception e) {
            return null;
        }
    }

    private static void notifySafely(Context context, int id, Notification notification) {
        try {
            NotificationManagerCompat manager = NotificationManagerCompat.from(context);
            if (!manager.areNotificationsEnabled()) {
                Log.w(TAG, "الإشعارات غير مفعلة من إعدادات النظام، لن يظهر الإشعار.");
                return;
            }
            manager.notify(id, notification);
        } catch (SecurityException e) {
            Log.e(TAG, "لم يتم منح إذن POST_NOTIFICATIONS، لن يظهر الإشعار.", e);
        } catch (Exception e) {
            Log.e(TAG, "خطأ أثناء عرض الإشعار", e);
        }
    }

    public static PendingIntent openApp(Context context, int requestCode) {
        return createActivityPendingIntent(context, MainActivity.class, requestCode, false);
    }

    private static PendingIntent createActivityPendingIntent(Context context, Class<?> activityClass, int requestCode, boolean clearTask) {
        Intent intent = new Intent(context, activityClass);
        if (clearTask) intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(context, requestCode, intent, flags);
    }

    private static final class PrayerTime {
        final String name;
        final long at;
        PrayerTime(String name, long at) { this.name = name; this.at = at; }
    }
}