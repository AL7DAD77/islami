package com.alhaddad.islami;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;

import java.util.ArrayList;
import java.util.List;

final class AdhanScheduler {
    static final String ACTION_ALARM = "com.alhaddad.islami.ACTION_ADHAN_ALARM";

    private AdhanScheduler() {}

    static boolean canExact(Context c) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true;
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        return am != null && am.canScheduleExactAlarms();
    }

    /**
     * يضبط المنبّه بأعلى دقة ممكنة:
     * 1) إن كانت صلاحية «المنبهات والتذكيرات» مفعّلة: منبّه دقيق يعمل حتى في وضع توفير الطاقة.
     * 2) وإلا (الوضع الافتراضي في أندرويد 14): setAlarmClock، وهو لا يحتاج صلاحية ويُطلق في وقته بدقة،
     *    لكنه يُظهر أيقونة المنبّه في شريط الحالة. هذا أفضل من منبّه غير دقيق قد يتأخر دقائق.
     */
    private static void setAlarm(Context c, AlarmManager am, long at, PendingIntent pi) {
        try {
            if (canExact(c)) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            } else {
                am.setAlarmClock(new AlarmManager.AlarmClockInfo(at, NotificationHelper.openApp(c)), pi);
            }
        } catch (SecurityException e) {
            try {
                am.setAlarmClock(new AlarmManager.AlarmClockInfo(at, NotificationHelper.openApp(c)), pi);
            } catch (Exception e2) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            }
        }
    }

    private static Intent alarmIntent(Context c, int id) {
        Intent i = new Intent(c, AdhanReceiver.class);
        i.setAction(ACTION_ALARM);
        i.setData(Uri.parse("adhan://alarm/" + id)); // يجعل كل تنبيه مميزاً
        return i;
    }

    private static void cancelScheduled(Context c, AlarmManager am) {
        for (int id : AdhanStore.scheduledIds(c)) {
            PendingIntent pi = PendingIntent.getBroadcast(
                    c, id, alarmIntent(c, id), PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
            if (pi != null) {
                am.cancel(pi);
                pi.cancel();
            }
        }
        AdhanStore.saveScheduledIds(c, new ArrayList<Integer>());
    }

    /** يجدول كل العناصر المخزنة التي لم يحن وقتها بعد. يعيد عدد التنبيهات. */
    static int scheduleAll(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return 0;
        cancelScheduled(c, am);

        long now = System.currentTimeMillis();
        List<Integer> ids = new ArrayList<>();

        for (AdhanStore.Item it : AdhanStore.load(c)) {
            if (it.at <= now) continue;
            Intent i = alarmIntent(c, it.id);
            i.putExtra("id", it.id);
            i.putExtra("kind", it.kind);
            i.putExtra("prayer", it.prayer);
            i.putExtra("title", it.title);
            i.putExtra("body", it.body);
            i.putExtra("file", it.file);
            i.putExtra("volume", it.volume);
            PendingIntent pi = PendingIntent.getBroadcast(
                    c, it.id, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            try {
                setAlarm(c, am, it.at, pi);
                ids.add(it.id);
            } catch (Exception ignored) {
            }
        }
        AdhanStore.saveScheduledIds(c, ids);
        return ids.size();
    }

    /** تنبيه تجريبي مستقل عن الجدول (id ثابت) ليتأكد المستخدم أن الأذان يعمل والتطبيق مغلق. */
    static void scheduleTest(Context c, int seconds, String file, float volume) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        final int id = 90001;
        Intent i = alarmIntent(c, id);
        i.putExtra("id", id);
        i.putExtra("kind", "adhan");
        i.putExtra("prayer", "");
        i.putExtra("title", "تجربة الأذان");
        i.putExtra("body", "هذا تنبيه تجريبي - الأذان يعمل بنجاح");
        i.putExtra("file", file == null ? "" : file);
        i.putExtra("volume", volume);
        PendingIntent pi = PendingIntent.getBroadcast(
                c, id, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        long at = System.currentTimeMillis() + Math.max(5, seconds) * 1000L;
        setAlarm(c, am, at, pi);
    }

    static void cancelAll(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) cancelScheduled(c, am);
    }
}
