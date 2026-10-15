package com.alhaddad.islami;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.SystemClock;
import android.widget.RemoteViews;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

final class NotificationHelper {
    static final String CH_PERSISTENT = "adhan_persistent";
    // معرّف جديد: أندرويد لا يغيّر أهمية قناة موجودة مسبقاً على الجهاز
    static final String CH_PLAYING = "adhan_playing_v2";
    static final String CH_REMINDER = "adhan_reminder";

    static final int ID_PERSISTENT = 9001;
    static final int ID_PLAYING = 9002;
    static final int BRAND_COLOR = 0xFF02634D; // أخضر التطبيق

    private static final String[] HIJRI_MONTHS = {
            "محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة",
            "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
    };

    private NotificationHelper() {}

    static void ensureChannels(Context c) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null) return;

        NotificationChannel persistent = new NotificationChannel(
                CH_PERSISTENT, "الصلاة القادمة (دائم)", NotificationManager.IMPORTANCE_LOW);
        persistent.setShowBadge(false);
        persistent.setSound(null, null);
        persistent.setDescription("إشعار دائم يعرض العداد والتاريخ الهجري");
        nm.createNotificationChannel(persistent);

        // أهمية عالية وظهور على شاشة القفل، حتى يظهر زر «إيقاف الأذان» بوضوح في وقت الأذان
        NotificationChannel playing = new NotificationChannel(
                CH_PLAYING, "تشغيل الأذان", NotificationManager.IMPORTANCE_HIGH);
        playing.setSound(null, null);
        playing.setShowBadge(false);
        playing.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
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
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
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

    /** التاريخ الهجري اليوم (تقويم أم القرى) بالأرقام العربية، مثل: ٣٠ ربيع الآخر ١٤٤٨ هـ */
    static String hijriToday() {
        try {
            android.icu.util.IslamicCalendar cal = new android.icu.util.IslamicCalendar();
            cal.setCalendarType(android.icu.util.IslamicCalendar.CalendarType.UMALQURA);
            cal.setTimeInMillis(System.currentTimeMillis());
            int day = cal.get(android.icu.util.Calendar.DAY_OF_MONTH);
            int month = cal.get(android.icu.util.Calendar.MONTH);
            int year = cal.get(android.icu.util.Calendar.YEAR);
            return arabicDigits(day) + " " + HIJRI_MONTHS[month] + " " + arabicDigits(year) + " هـ";
        } catch (Throwable t) {
            return "";
        }
    }

    private static String arabicDigits(int n) {
        String western = String.valueOf(n);
        StringBuilder sb = new StringBuilder();
        for (char ch : western.toCharArray()) {
            if (ch >= '0' && ch <= '9') sb.append((char) ('٠' + (ch - '0')));
            else sb.append(ch);
        }
        return sb.toString();
    }

    /**
     * الإشعار الدائم:
     * - من أذان إلى منتصف الفترة: العداد موجب (+) يصعد من صفر، والعنوان «منذ أذان ...»
     * - من المنتصف إلى الأذان التالي: العداد سالب (-) ينازل إلى صفر، والعنوان «باقي على أذان ...»
     * ثم يبدأ الدور من جديد عند الأذان التالي. التحول يتم عبر منبهات مجدولة عند الأوقات ومنتصف كل فترة.
     */
    @SuppressLint("MissingPermission")
    static void updatePersistent(Context c) {
        NotificationManagerCompat nm = NotificationManagerCompat.from(c);
        if (!AdhanStore.isPersistent(c)) {
            nm.cancel(ID_PERSISTENT);
            return;
        }
        ensureChannels(c);

        long now = System.currentTimeMillis();
        AdhanStore.Item prev = null;
        AdhanStore.Item next = null;
        for (AdhanStore.Item it : AdhanStore.load(c)) {
            if (!"adhan".equals(it.kind) && !"time".equals(it.kind)) continue;
            // تجاهل عناصر منتصف الليل (بلا اسم صلاة): هي لتحديث التاريخ الهجري فقط وليست حدّاً بين صلاتين
            if (it.prayer == null || it.prayer.isEmpty()) continue;
            if (it.at <= now) {
                if (prev == null || it.at > prev.at) prev = it;
            } else {
                if (next == null || it.at < next.at) next = it;
            }
        }

        RemoteViews rv = new RemoteViews(c.getPackageName(), R.layout.notif_persistent);
        rv.setTextViewText(R.id.notif_hijri, hijriToday());

        if (prev == null || next == null) {
            // لا توجد مواقيت مخزنة (لم يُفتح التطبيق منذ مدة): نطلب فتحه
            rv.setTextViewText(R.id.notif_title, "إسلامي");
            rv.setChronometer(R.id.notif_timer, SystemClock.elapsedRealtime(), "%s", false);
        } else {
            long mid = prev.at + (next.at - prev.at) / 2;
            boolean counting_up = now < mid;

            if (counting_up) {
                // (+) منذ الأذان: عداد يصعد، أساسه وقت الأذان الماضي
                rv.setTextViewText(R.id.notif_title, "منذ أذان " + arabicName(prev.prayer));
                long base = SystemClock.elapsedRealtime() - (now - prev.at);
                rv.setChronometer(R.id.notif_timer, base, "+%s", true);
                rv.setChronometerCountDown(R.id.notif_timer, false);
                // خلفية مصوّرة للحالة الأولى فقط، مع نصوص فاتحة تُقرأ على الأخضر في الوضعين الفاتح والداكن
                float dp = c.getResources().getDisplayMetrics().density;
                rv.setInt(R.id.notif_root, "setBackgroundResource", R.drawable.notif_bg_after);
                rv.setViewPadding(R.id.notif_root, (int) (12 * dp), (int) (6 * dp), (int) (12 * dp), (int) (6 * dp));
                rv.setTextColor(R.id.notif_title, 0xFFFFFFFF);
                rv.setTextColor(R.id.notif_timer, 0xFFFFFFFF);
                rv.setTextColor(R.id.notif_hijri, 0xFFE8D9A8);
            } else {
                // (-) باقي على الأذان: عداد ينازل حتى الصفر، أساسه وقت الأذان القادم
                rv.setTextViewText(R.id.notif_title, "باقي على أذان " + arabicName(next.prayer));
                long base = SystemClock.elapsedRealtime() + (next.at - now);
                rv.setChronometer(R.id.notif_timer, base, "-%s", true);
                rv.setChronometerCountDown(R.id.notif_timer, true);
            }
        }

        Notification n = new NotificationCompat.Builder(c, CH_PERSISTENT)
                .setSmallIcon(R.drawable.ic_stat_adhan)
                .setColor(BRAND_COLOR)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setSilent(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_STATUS)
                .setContentIntent(openApp(c))
                .setCustomContentView(rv)
                .setStyle(new NotificationCompat.DecoratedCustomViewStyle())
                .build();
        try {
            nm.notify(ID_PERSISTENT, n);
        } catch (SecurityException ignored) {
        }
    }
}
