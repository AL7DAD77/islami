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

/**
 * AdhanScheduler
 * <p>
 * مسؤول عن جدولة تنبيهات الأذان والتذكيرات وتحديثات منتصف الليل.
 */
public final class AdhanScheduler {

    private static final String TAG = "AdhanScheduler";

    public static final String ACTION_ALARM =
            "com.alhaddad.islami.ACTION_ADHAN_ALARM";

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
    private static final int MIN_TEST_DELAY_SECONDS = 5;

    private AdhanScheduler() {
        // منع إنشاء كائن من هذا الكلاس
    }

    /* ============================ فحص الصلاحيات ============================ */

    public static boolean canScheduleExactAlarms(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            return true;
        }
        AlarmManager alarmManager = getAlarmManager(context);
        return alarmManager != null && alarmManager.canScheduleExactAlarms();
    }

    /* ============================== الجدولة ============================== */

    public static int scheduleAll(Context context) {
        AlarmManager alarmManager = getAlarmManager(context);

        if (alarmManager == null) {
            Log.w(TAG, "AlarmManager غير متاح");
            return 0;
        }

        cancelScheduledAlarms(context, alarmManager);

        long now = System.currentTimeMillis();
        List<Integer> scheduledIds = new ArrayList<>();
        List<AdhanStore.Item> items = AdhanStore.load(context);

        if (items == null || items.isEmpty()) {
            AdhanStore.saveScheduledIds(context, scheduledIds);
            return 0;
        }

        for (AdhanStore.Item item : items) {
            if (!isValidItem(item) || item.at <= now) {
                continue;
            }
            PendingIntent pendingIntent = createAlarmPendingIntent(context, item);
            if (pendingIntent == null) {
                continue;
            }
            if (setAlarm(context, alarmManager, item.at, pendingIntent)) {
                scheduledIds.add(item.id);
            }
        }

        AdhanStore.saveScheduledIds(context, scheduledIds);
        Log.i(TAG, "تمت جدولة " + scheduledIds.size() + " حدثًا بنجاح");
        return scheduledIds.size();
    }

    public static void scheduleNextAdhan(Context context) {
        AlarmManager alarmManager = getAlarmManager(context);
        if (alarmManager == null) return;

        AdhanStore.Item nextItem = findNextItem(context);
        if (nextItem == null) return;

        PendingIntent pendingIntent = createAlarmPendingIntent(context, nextItem);
        if (pendingIntent != null) {
            setAlarm(context, alarmManager, nextItem.at, pendingIntent);
        }
    }

    public static void scheduleTest(Context context, int seconds, String file, float volume) {
        AlarmManager alarmManager = getAlarmManager(context);
        if (alarmManager == null) return;

        long triggerAtMillis = System.currentTimeMillis() + Math.max(MIN_TEST_DELAY_SECONDS, seconds) * 1000L;

        AdhanStore.Item testItem = new AdhanStore.Item();
        testItem.id = TEST_ALARM_ID;
        testItem.at = triggerAtMillis;
        testItem.kind = "adhan";
        testItem.prayer = "";
        testItem.title = "تجربة الأذان";
        testItem.body = "هذا تنبيه تجريبي - الأذان يعمل بنجاح";
        testItem.file = file == null ? "" : file;
        testItem.volume = volume;

        PendingIntent pendingIntent = createAlarmPendingIntent(context, testItem);
        if (pendingIntent != null) {
            setAlarm(context, alarmManager, triggerAtMillis, pendingIntent);
        }
    }

    /* ============================== الإلغاء ============================== */

    public static void cancelAll(Context context) {
        AlarmManager alarmManager = getAlarmManager(context);
        if (alarmManager != null) {
            cancelScheduledAlarms(context, alarmManager);
        }
    }

    /* ======================= جدولة التذكيرات (جديد) ======================= */

    public static void scheduleReminderAlarm(Context context, int id, long intervalMillis, String title, String body) {
        AlarmManager alarmManager = getAlarmManager(context);
        if (alarmManager == null) return;

        Intent intent = new Intent(context, AdhanReceiver.class);
        intent.setAction("com.alhaddad.islami.ACTION_REMINDER_ALARM");
        intent.setData(Uri.parse("reminder://alarm/" + id)); // مسار مستقل
        intent.putExtra("id", id);
        intent.putExtra("title", title);
        intent.putExtra("body", body);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context, id, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        long triggerAt = System.currentTimeMillis() + intervalMillis;

        if (canScheduleExactAlarms(context)) {
            alarmManager.setRepeating(AlarmManager.RTC_WAKEUP, triggerAt, intervalMillis, pendingIntent);
        } else {
            alarmManager.setInexactRepeating(AlarmManager.RTC_WAKEUP, triggerAt, intervalMillis, pendingIntent);
        }
        Log.i(TAG, "تمت جدولة التذكير رقم " + id + " كل " + (intervalMillis / 60000) + " دقيقة");
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
            Log.i(TAG, "تم إلغاء التذكير رقم " + id);
        }
    }

    /* ============================ دوال مساعدة ============================ */

    private static AlarmManager getAlarmManager(Context context) {
        return (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    }

    private static AdhanStore.Item findNextItem(Context context) {
        List<AdhanStore.Item> items = AdhanStore.load(context);
        if (items == null || items.isEmpty()) return null;

        long now = System.currentTimeMillis();
        AdhanStore.Item nextItem = null;

        for (AdhanStore.Item item : items) {
            if (!isValidItem(item) || item.at <= now) continue;
            if (nextItem == null || item.at < nextItem.at) {
                nextItem = item;
            }
        }
        return nextItem;
    }

    private static boolean isValidItem(AdhanStore.Item item) {
        return item != null && item.id > 0 && item.at > 0 && item.kind != null && !item.kind.trim().isEmpty();
    }

    private static boolean setAlarm(Context context, AlarmManager alarmManager, long triggerAtMillis, PendingIntent operation) {
        try {
            if (canScheduleExactAlarms(context)) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, operation);
                return true;
            }
            return setAlarmClockFallback(context, alarmManager, triggerAtMillis, operation);
        } catch (SecurityException e) {
            Log.w(TAG, "تم رفض التنبيه الدقيق، سيتم استخدام البديل", e);
            return setAlarmClockFallback(context, alarmManager, triggerAtMillis, operation);
        } catch (Exception e) {
            Log.e(TAG, "خطأ غير متوقع أثناء جدولة التنبيه", e);
            return false;
        }
    }

    private static boolean setAlarmClockFallback(Context context, AlarmManager alarmManager, long triggerAtMillis, PendingIntent operation) {
        try {
            AlarmManager.AlarmClockInfo alarmClockInfo = new AlarmManager.AlarmClockInfo(
                    triggerAtMillis, NotificationHelper.openApp(context, 0)
            );
            alarmManager.setAlarmClock(alarmClockInfo, operation);
            return true;
        } catch (Exception e) {
            Log.w(TAG, "فشل setAlarmClock، سيتم استخدام جدولة احتياطية", e);
            return setInexactFallback(alarmManager, triggerAtMillis, operation);
        }
    }

    private static boolean setInexactFallback(AlarmManager alarmManager, long triggerAtMillis, PendingIntent operation) {
        try {
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, operation);
            return true;
        } catch (Exception e) {
            Log.e(TAG, "فشلت كل طرق جدولة التنبيه", e);
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

            return PendingIntent.getBroadcast(
                    context, item.id, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
        } catch (Exception e) {
            Log.e(TAG, "خطأ في إنشاء PendingIntent للحدث رقم " + item.id, e);
            return null;
        }
    }

    private static void cancelScheduledAlarms(Context context, AlarmManager alarmManager) {
        List<Integer> scheduledIds = AdhanStore.scheduledIds(context);
        if (scheduledIds == null || scheduledIds.isEmpty()) return;

        for (Integer id : scheduledIds) {
            if (id == null || id <= 0) continue;
            try {
                Intent intent = createAlarmIntent(context, id);
                PendingIntent pendingIntent = PendingIntent.getBroadcast(
                        context, id, intent, PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
                );
                if (pendingIntent != null) {
                    alarmManager.cancel(pendingIntent);
                    pendingIntent.cancel();
                }
            } catch (Exception e) {
                Log.w(TAG, "تعذر إلغاء التنبيه رقم " + id, e);
            }
        }
        AdhanStore.saveScheduledIds(context, new ArrayList<Integer>());
    }
}