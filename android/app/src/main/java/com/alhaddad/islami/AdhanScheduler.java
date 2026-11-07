package com.alhaddad.islami;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class AdhanScheduler {

    private static final String TAG = "AdhanScheduler";

    public static final String ACTION_ALARM = "com.alhaddad.islami.ACTION_ADHAN_ALARM";
    public static final String ACTION_REMINDER = "com.alhaddad.islami.ACTION_REMINDER_ALARM";

    private static final String URI_SCHEME = "adhan";
    private static final String URI_HOST = "alarm";

    private static final String EXTRA_ID = "id";
    private static final String EXTRA_KIND = "kind";
    private static final String EXTRA_PRAYER = "prayer";
    private static final String EXTRA_TITLE = "title";
    private static final String EXTRA_BODY = "body";
    private static final String EXTRA_FILE = "file";
    private static final String EXTRA_VOLUME = "volume";

    private static final int TEST_ALARM_ID = 90001;

    private static final String REMINDER_PREFS = "ReminderSettings";
    private static final int[] REMINDER_IDS = {777, 888};

    private AdhanScheduler() {}

    /* ============================ فحص الصلاحيات ============================ */

    public static boolean canScheduleExactAlarms(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true;
        AlarmManager alarmManager = getAlarmManager(context);
        return alarmManager != null && alarmManager.canScheduleExactAlarms();
    }

    /* ============================== جدولة الأذان ============================== */

    public static int scheduleAll(Context context) {
        AlarmManager alarmManager = getAlarmManager(context);
        if (alarmManager == null) return 0;

        cancelScheduledAlarms(context, alarmManager);

        long now = System.currentTimeMillis();
        List<Integer> scheduledIds = new ArrayList<>();
        List<AdhanStore.Item> items = AdhanStore.load(context);

        if (items == null || items.isEmpty()) {
            AdhanStore.saveScheduledIds(context, scheduledIds);
            return 0;
        }

        for (AdhanStore.Item item : items) {
            if (!isValidPrayerItem(item) || item.at <= now) continue;

            PendingIntent pendingIntent = createAlarmPendingIntent(context, item);
            if (pendingIntent != null && setAdhanAlarm(context, alarmManager, item.at, pendingIntent)) {
                scheduledIds.add(item.id);
            }
        }

        AdhanStore.saveScheduledIds(context, scheduledIds);
        return scheduledIds.size();
    }

    public static void scheduleNextAdhan(Context context) {
        AlarmManager alarmManager = getAlarmManager(context);
        if (alarmManager == null) return;

        AdhanStore.Item nextItem = findNextItem(context);
        if (nextItem == null) return;

        PendingIntent pendingIntent = createAlarmPendingIntent(context, nextItem);
        if (pendingIntent != null) {
            setAdhanAlarm(context, alarmManager, nextItem.at, pendingIntent);
        }
    }

    public static void scheduleTest(Context context, int seconds, String file, float volume) {
        AlarmManager alarmManager = getAlarmManager(context);
        if (alarmManager == null) return;

        long triggerAtMillis = System.currentTimeMillis() + Math.max(5, seconds) * 1000L;

        AdhanStore.Item testItem = new AdhanStore.Item();
        testItem.id = TEST_ALARM_ID;
        testItem.at = triggerAtMillis;
        testItem.kind = "adhan";
        testItem.prayer = "fajr";
        testItem.title = "تجربة الأذان";
        testItem.body = "هذا تنبيه تجريبي - الأذان يعمل بنجاح";
        testItem.file = file == null ? "" : file;
        testItem.volume = volume;

        PendingIntent pendingIntent = createAlarmPendingIntent(context, testItem);
        if (pendingIntent != null) {
            setAdhanAlarm(context, alarmManager, triggerAtMillis, pendingIntent);
        }
    }

    /* ======================= جدولة التذكيرات (مستقلة) ======================= */

    public static void scheduleReminderAlarm(Context context, int id, long intervalMillis, String title, String body) {
        AlarmManager alarmManager = getAlarmManager(context);
        if (alarmManager == null) return;

        saveReminderState(context, id, intervalMillis, title, body);

        Intent intent = createReminderIntent(context, id);
        intent.putExtra(EXTRA_ID, id);
        intent.putExtra(EXTRA_TITLE, title);
        intent.putExtra(EXTRA_BODY, body);
        intent.putExtra("intervalMillis", intervalMillis);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context, id, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        long triggerAt = System.currentTimeMillis() + intervalMillis;

        if (canScheduleExactAlarms(context)) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent);
        } else {
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent);
        }
    }

    public static void cancelReminder(Context context, int id) {
        AlarmManager alarmManager = getAlarmManager(context);
        if (alarmManager == null) return;

        clearReminderState(context, id);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context, id, createReminderIntent(context, id),
                PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
        );

        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent);
            pendingIntent.cancel();
        }
    }

    /** إعادة جدولة كل التذكيرات المفعلة بعد الإقلاع أو تحديث التطبيق */
    public static void rescheduleAllReminders(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(REMINDER_PREFS, Context.MODE_PRIVATE);
        int rescheduled = 0;

        for (int id : REMINDER_IDS) {
            if (!prefs.getBoolean("reminder_" + id + "_enabled", false)) continue;

            long interval = prefs.getLong("reminder_" + id + "_interval", 3600000L);
            String title = prefs.getString("reminder_" + id + "_title", "تذكير");
            String body = prefs.getString("reminder_" + id + "_body", "");

            try {
                scheduleReminderAlarm(context, id, interval, title, body);
                rescheduled++;
            } catch (Exception e) {
                Log.e(TAG, "تعذر إعادة جدولة التذكير " + id, e);
            }
        }
        Log.i(TAG, "تمت إعادة جدولة " + rescheduled + " تذكير بعد الإقلاع");
    }

    /* ================== حفظ واسترجاع حالة التذكيرات ================== */

    private static void saveReminderState(Context context, int id, long intervalMillis, String title, String body) {
        try {
            context.getSharedPreferences(REMINDER_PREFS, Context.MODE_PRIVATE).edit()
                    .putBoolean("reminder_" + id + "_enabled", true)
                    .putLong("reminder_" + id + "_interval", intervalMillis)
                    .putString("reminder_" + id + "_title", title)
                    .putString("reminder_" + id + "_body", body)
                    .apply();
        } catch (Exception e) {
            Log.e(TAG, "تعذر حفظ حالة التذكير " + id, e);
        }
    }

    private static void clearReminderState(Context context, int id) {
        try {
            context.getSharedPreferences(REMINDER_PREFS, Context.MODE_PRIVATE).edit()
                    .remove("reminder_" + id + "_enabled")
                    .remove("reminder_" + id + "_interval")
                    .remove("reminder_" + id + "_title")
                    .remove("reminder_" + id + "_body")
                    .apply();
        } catch (Exception e) {
            Log.e(TAG, "تعذر حذف حالة التذكير " + id, e);
        }
    }

    /* ============================== الإلغاء ============================== */

    public static void cancelAll(Context context) {
        AlarmManager alarmManager = getAlarmManager(context);
        if (alarmManager != null) cancelScheduledAlarms(context, alarmManager);
    }

    /* ============================ دوال مساعدة ============================ */

    private static AlarmManager getAlarmManager(Context context) {
        return (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    }

    private static boolean isValidPrayerItem(AdhanStore.Item item) {
        if (item == null || item.id <= 0 || item.at <= 0 || item.prayer == null) return false;
        String p = item.prayer.toLowerCase(Locale.US);
        return p.equals("fajr") || p.equals("dhuhr") || p.equals("asr")
                || p.equals("maghrib") || p.equals("isha") || p.equals("sunrise");
    }

    private static AdhanStore.Item findNextItem(Context context) {
        List<AdhanStore.Item> items = AdhanStore.load(context);
        if (items == null) return null;

        long now = System.currentTimeMillis();
        AdhanStore.Item nextItem = null;

        for (AdhanStore.Item item : items) {
            if (!isValidPrayerItem(item) || item.at <= now) continue;
            if (nextItem == null || item.at < nextItem.at) nextItem = item;
        }
        return nextItem;
    }

    /**
     * تنبيه الأذان: يستخدم setAlarmClock لضمان التشغيل الدقيق.
     * لو فشل، يرجع لـ setExact.
     */
    private static boolean setAdhanAlarm(Context context, AlarmManager alarmManager,
                                         long triggerAtMillis, PendingIntent operation) {
        try {
            PendingIntent showIntent = NotificationHelper.openApp(context, 0);
            alarmManager.setAlarmClock(
                    new AlarmManager.AlarmClockInfo(triggerAtMillis, showIntent),
                    operation
            );
            return true;
        } catch (Exception e) {
            Log.e(TAG, "setAlarmClock فشل، جاري الرجوع لـ setExact", e);
            try {
                if (canScheduleExactAlarms(context)) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, operation);
                } else {
                    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, operation);
                }
                return true;
            } catch (Exception ex) {
                Log.e(TAG, "تعذر ضبط تنبيه الأذان", ex);
                return false;
            }
        }
    }

    private static Intent createAlarmIntent(Context context, int id) {
        Intent intent = new Intent(context, AdhanReceiver.class);
        intent.setAction(ACTION_ALARM);
        intent.setData(Uri.parse(URI_SCHEME + "://" + URI_HOST + "/" + id));
        return intent;
    }

    private static Intent createReminderIntent(Context context, int id) {
        Intent intent = new Intent(context, AdhanReceiver.class);
        intent.setAction(ACTION_REMINDER);
        intent.setData(Uri.parse("reminder://alarm/" + id));
        return intent;
    }

    private static PendingIntent createAlarmPendingIntent(Context context, AdhanStore.Item item) {
        try {
            Intent intent = createAlarmIntent(context, item.id);
            intent.putExtra(EXTRA_ID, item.id);
            intent.putExtra(EXTRA_KIND, item.kind);
            intent.putExtra(EXTRA_PRAYER, item.prayer == null ? "" : item.prayer);
            intent.putExtra(EXTRA_TITLE, item.title == null ? "" : item.title);
            intent.putExtra(EXTRA_BODY, item.body == null ? "" : item.body);
            intent.putExtra(EXTRA_FILE, item.file == null ? "" : item.file);
            intent.putExtra(EXTRA_VOLUME, item.volume);
            return PendingIntent.getBroadcast(
                    context, item.id, intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
        } catch (Exception e) {
            Log.e(TAG, "تعذر إنشاء PendingIntent للأذان", e);
            return null;
        }
    }

    private static void cancelScheduledAlarms(Context context, AlarmManager alarmManager) {
        List<Integer> scheduledIds = AdhanStore.scheduledIds(context);
        if (scheduledIds == null) return;

        for (Integer id : scheduledIds) {
            if (id == null || id <= 0) continue;

            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    context, id, createAlarmIntent(context, id),
                    PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
            );
            if (pendingIntent != null) {
                alarmManager.cancel(pendingIntent);
                pendingIntent.cancel();
            }
        }
        AdhanStore.saveScheduledIds(context, new ArrayList<Integer>());
    }
}