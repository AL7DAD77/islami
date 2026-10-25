package com.alhaddad.islami;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class AdhanScheduler {

    private static final String TAG = "AdhanScheduler";
    public static final String ACTION_ALARM = "com.alhaddad.islami.ACTION_ADHAN_ALARM";

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

    private AdhanScheduler() {}

    /* ============================ فحص الصلاحيات ============================ */

    public static boolean canScheduleExactAlarms(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true;
        AlarmManager alarmManager = getAlarmManager(context);
        return alarmManager != null && alarmManager.canScheduleExactAlarms();
    }

    /* ============================== الجدولة الأساسية (للأذان) ============================== */

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
            // ✅ استخدام الفلتر لمنع التذكيرات من الدخول هنا
            if (!isValidPrayerItem(item) || item.at <= now) continue;
            
            PendingIntent pendingIntent = createAlarmPendingIntent(context, item);
            if (pendingIntent != null && setAlarm(context, alarmManager, item.at, pendingIntent)) {
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
        if (nextItem != null) {
            PendingIntent pendingIntent = createAlarmPendingIntent(context, nextItem);
            if (pendingIntent != null) setAlarm(context, alarmManager, nextItem.at, pendingIntent);
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
        testItem.prayer = "fajr"; // نعطيها اسم صلاة صريح لكي تعمل
        testItem.title = "تجربة الأذان";
        testItem.body = "هذا تنبيه تجريبي - الأذان يعمل بنجاح";
        testItem.file = file == null ? "" : file;
        testItem.volume = volume;

        PendingIntent pendingIntent = createAlarmPendingIntent(context, testItem);
        if (pendingIntent != null) setAlarm(context, alarmManager, triggerAtMillis, pendingIntent);
    }

    /* ======================= جدولة التذكيرات (مستقلة تماماً) ======================= */

    public static void scheduleReminderAlarm(Context context, int id, long intervalMillis, String title, String body) {
        AlarmManager alarmManager = getAlarmManager(context);
        if (alarmManager == null) return;

        Intent intent = new Intent(context, AdhanReceiver.class);
        intent.setAction("com.alhaddad.islami.ACTION_REMINDER_ALARM");
        intent.setData(Uri.parse("reminder://alarm/" + id));
        intent.putExtra("id", id);
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        intent.putExtra("intervalMillis", intervalMillis);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context, id, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        long triggerAt = System.currentTimeMillis() + intervalMillis;

        try {
            if (canScheduleExactAlarms(context)) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent);
            } else {
                alarmManager.setAlarmClock(new AlarmManager.AlarmClockInfo(triggerAt, pendingIntent), pendingIntent);
            }
        } catch (SecurityException e) {
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent);
        }
    }

    public static void cancelReminder(Context context, int id) {
        AlarmManager alarmManager = getAlarmManager(context);
        if (alarmManager == null) return;
        
        Intent intent = new Intent(context, AdhanReceiver.class);
        intent.setAction("com.alhaddad.islami.ACTION_REMINDER_ALARM");
        intent.setData(Uri.parse("reminder://alarm/" + id));
        
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context, id, intent, PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
        );
        
        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent);
            pendingIntent.cancel();
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

    // ✅ فلتر لمنع أي شيء ليس صلاة من الدخول في مواقيت الصلاة
    private static boolean isValidPrayerItem(AdhanStore.Item item) {
        if (item == null || item.id <= 0 || item.at <= 0 || item.prayer == null) return false;
        String p = item.prayer.toLowerCase(Locale.US);
        return p.equals("fajr") || p.equals("dhuhr") || p.equals("asr") || p.equals("maghrib") || p.equals("isha") || p.equals("sunrise");
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

    private static boolean setAlarm(Context context, AlarmManager alarmManager, long triggerAtMillis, PendingIntent operation) {
        try {
            if (canScheduleExactAlarms(context)) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, operation);
                return true;
            }
            alarmManager.setAlarmClock(new AlarmManager.AlarmClockInfo(triggerAtMillis, NotificationHelper.openApp(context, 0)), operation);
            return true;
        } catch (SecurityException e) {
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, operation);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private static Intent createAlarmIntent(Context context, int id) {
        Intent intent = new Intent(context, AdhanReceiver.class);
        intent.setAction(ACTION_ALARM);
        intent.setData(Uri.parse(URI_SCHEME + "://" + URI_HOST + "/" + id));
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
            return PendingIntent.getBroadcast(context, item.id, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        } catch (Exception e) { return null; }
    }

    private static void cancelScheduledAlarms(Context context, AlarmManager alarmManager) {
        List<Integer> scheduledIds = AdhanStore.scheduledIds(context);
        if (scheduledIds == null) return;
        for (Integer id : scheduledIds) {
            if (id != null && id > 0) {
                Intent intent = createAlarmIntent(context, id);
                PendingIntent pendingIntent = PendingIntent.getBroadcast(context, id, intent, PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
                if (pendingIntent != null) {
                    alarmManager.cancel(pendingIntent);
                    pendingIntent.cancel();
                }
            }
        }
        AdhanStore.saveScheduledIds(context, new ArrayList<Integer>());
    }
}