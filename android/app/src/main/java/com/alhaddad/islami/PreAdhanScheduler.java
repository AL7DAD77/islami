package com.alhaddad.islami;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * PreAdhanScheduler
 *
 * جدولة تنبيه قبل الأذان بشكل مستقل تماماً.
 */
@CapacitorPlugin(name = "PreAdhanScheduler")
public final class PreAdhanScheduler extends Plugin {

    private static final String TAG = "PreAdhanScheduler";

    public static final String ACTION_PRE_ADHAN_ALARM =
            "com.alhaddad.islami.ACTION_PRE_ADHAN_ALARM";

    // ✅ تم رفع إصدار القناة إلى v2 لتجاوز القناة الصامتة القديمة
    public static final String PRE_ADHAN_CHANNEL_ID =
            "pre_adhan_channel_v2";

    private static final String URI_SCHEME = "pre_adhan";
    private static final String URI_HOST = "alarm";

    private static final String EXTRA_ID = "id";
    private static final String EXTRA_PRAYER = "prayer";
    private static final String EXTRA_PRAYER_NAME = "prayerName";
    private static final String EXTRA_TITLE = "title";
    private static final String EXTRA_BODY = "body";

    private static final String PREFS_NAME = "pre_adhan_store_prefs";
    private static final String KEY_ITEMS = "items";
    private static final String KEY_SCHEDULED_IDS = "scheduled_ids";

    private static final int MINIMUM_GAP_MINUTES = 5;
    private static final int MINIMUM_GAP_MILLIS =
            MINIMUM_GAP_MINUTES * 60 * 1000;

    /* ============================== دورة الحياة ============================== */

    @Override
    public void load() {
        super.load();

        try {
            createNotificationChannel(getContext());
        } catch (Exception e) {
            Log.e(TAG, "تعذر إنشاء قناة التنبيه قبل الأذان", e);
        }
    }

    /* ============================== واجهة JavaScript ============================== */

    @PluginMethod()
    public void schedule(PluginCall call) {
        try {
            JSArray itemsArray = call.getArray("items");

            List<PreAdhanItem> items = new ArrayList<>();

            if (itemsArray != null) {
                items = parseItems(itemsArray);
            }

            if (items.isEmpty()) {
                clearAll(getContext());

                JSObject emptyResult = new JSObject();
                emptyResult.put("scheduled", 0);
                emptyResult.put(
                        "exactAlarmAllowed",
                        canScheduleExactAlarms(getContext())
                );

                call.resolve(emptyResult);
                return;
            }

            saveItems(getContext(), items);

            int scheduledCount = scheduleAll(getContext());

            JSObject result = new JSObject();
            result.put("scheduled", scheduledCount);
            result.put(
                    "exactAlarmAllowed",
                    canScheduleExactAlarms(getContext())
            );

            call.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "تعذر جدولة التنبيه قبل الأذان", e);
            call.reject("تعذر جدولة التنبيه قبل الأذان");
        }
    }

    @PluginMethod()
    public void stop(PluginCall call) {
        try {
            clearAll(getContext());
            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "تعذر إيقاف التنبيه قبل الأذان", e);
            call.reject("تعذر إيقاف التنبيه قبل الأذان");
        }
    }

    @PluginMethod()
    public void cancelAll(PluginCall call) {
        try {
            clearAll(getContext());
            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "تعذر إلغاء التنبيهات قبل الأذان", e);
            call.reject("تعذر إلغاء التنبيهات قبل الأذان");
        }
    }

    /* ============================== الجدولة ============================== */

    public static int scheduleAll(Context context) {
        AlarmManager alarmManager = getAlarmManager(context);

        if (alarmManager == null) {
            return 0;
        }

        cancelScheduledAlarms(context, alarmManager);

        long now = System.currentTimeMillis();
        List<Integer> scheduledIds = new ArrayList<>();
        List<PreAdhanItem> items = loadItems(context);

        if (items.isEmpty()) {
            saveScheduledIds(context, scheduledIds);
            return 0;
        }

        for (PreAdhanItem item : items) {
            if (!isValidItem(item) || item.at <= now) {
                continue;
            }

            PendingIntent pendingIntent =
                    createAlarmPendingIntent(context, item);

            if (pendingIntent == null) {
                continue;
            }

            if (setPreAdhanAlarm(
                    context,
                    alarmManager,
                    item.at,
                    pendingIntent
            )) {
                scheduledIds.add(item.id);
            }
        }

        saveScheduledIds(context, scheduledIds);

        return scheduledIds.size();
    }

    public static void rescheduleAll(Context context) {
        try {
            scheduleAll(context);
        } catch (Exception e) {
            Log.e(TAG, "تعذر إعادة جدولة التنبيهات قبل الأذان", e);
        }
    }

    public static void clearAll(Context context) {
        AlarmManager alarmManager = getAlarmManager(context);

        if (alarmManager != null) {
            cancelScheduledAlarms(context, alarmManager);
        }

        saveItems(context, new ArrayList<PreAdhanItem>());
        saveScheduledIds(context, new ArrayList<Integer>());
    }

    /* ============================== التحقق والجدولة ============================== */

    private static boolean isValidItem(PreAdhanItem item) {
        if (item == null) {
            return false;
        }

        if (item.id <= 0 || item.at <= 0) {
            return false;
        }

        if (item.prayer == null || item.prayer.trim().isEmpty()) {
            return false;
        }

        if (item.title == null || item.title.trim().isEmpty()) {
            return false;
        }

        return true;
    }

    private static boolean setPreAdhanAlarm(
            Context context,
            AlarmManager alarmManager,
            long triggerAtMillis,
            PendingIntent operation
    ) {
        try {
            if (canScheduleExactAlarms(context)) {
                alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        triggerAtMillis,
                        operation
                );
            } else {
                alarmManager.setAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        triggerAtMillis,
                        operation
                );
            }

            return true;

        } catch (Exception e) {
            Log.e(TAG, "تعذر ضبط تنبيه قبل الأذان", e);
            return false;
        }
    }

    public static boolean canScheduleExactAlarms(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            return true;
        }

        AlarmManager alarmManager = getAlarmManager(context);

        return alarmManager != null
                && alarmManager.canScheduleExactAlarms();
    }

    /* ============================== PendingIntents ============================== */

    private static Intent createAlarmIntent(Context context, int id) {
        Intent intent = new Intent(context, PreAdhanReceiver.class);
        intent.setAction(ACTION_PRE_ADHAN_ALARM);
        intent.setData(
                Uri.parse(URI_SCHEME + "://" + URI_HOST + "/" + id)
        );

        return intent;
    }

    private static PendingIntent createAlarmPendingIntent(
            Context context,
            PreAdhanItem item
    ) {
        try {
            Intent intent = createAlarmIntent(context, item.id);

            intent.putExtra(EXTRA_ID, item.id);
            intent.putExtra(EXTRA_PRAYER, item.prayer);
            intent.putExtra(EXTRA_PRAYER_NAME, item.prayerName);
            intent.putExtra(EXTRA_TITLE, item.title);
            intent.putExtra(EXTRA_BODY, item.body);

            return PendingIntent.getBroadcast(
                    context,
                    item.id,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT
                            | PendingIntent.FLAG_IMMUTABLE
            );

        } catch (Exception e) {
            Log.e(TAG, "تعذر إنشاء PendingIntent للتنبيه قبل الأذان", e);
            return null;
        }
    }

    private static void cancelScheduledAlarms(
            Context context,
            AlarmManager alarmManager
    ) {
        List<Integer> scheduledIds = loadScheduledIds(context);

        for (Integer id : scheduledIds) {
            if (id == null || id <= 0) {
                continue;
            }

            try {
                Intent intent = createAlarmIntent(context, id);

                PendingIntent pendingIntent = PendingIntent.getBroadcast(
                        context,
                        id,
                        intent,
                        PendingIntent.FLAG_NO_CREATE
                                | PendingIntent.FLAG_IMMUTABLE
                );

                if (pendingIntent != null) {
                    alarmManager.cancel(pendingIntent);
                    pendingIntent.cancel();
                }

            } catch (Exception e) {
                Log.w(TAG, "تعذر إلغاء تنبيه قبل الأذان: " + id, e);
            }
        }
    }

    /* ============================== التخزين ============================== */

    private static List<PreAdhanItem> loadItems(Context context) {
        List<PreAdhanItem> items = new ArrayList<>();

        if (context == null) {
            return items;
        }

        try {
            String rawData = getPreferences(context)
                    .getString(KEY_ITEMS, null);

            if (rawData == null || rawData.trim().isEmpty()) {
                return items;
            }

            JSONArray jsonArray = new JSONArray(rawData);

            for (int index = 0; index < jsonArray.length(); index++) {
                JSONObject json = jsonArray.optJSONObject(index);

                if (json == null) {
                    continue;
                }

                PreAdhanItem item = new PreAdhanItem();
                item.id = json.optInt("id", 0);
                item.at = json.optLong("at", 0L);
                item.prayer = json.optString("prayer", "");
                item.prayerName = json.optString("prayerName", "");
                item.title = json.optString("title", "");
                item.body = json.optString("body", "");

                items.add(item);
            }

        } catch (Exception e) {
            Log.e(TAG, "تعذر قراءة تنبيهات ما قبل الأذان", e);
        }

        return items;
    }

    private static void saveItems(
            Context context,
            List<PreAdhanItem> items
    ) {
        if (context == null) {
            return;
        }

        try {
            JSONArray jsonArray = new JSONArray();

            if (items != null) {
                for (PreAdhanItem item : items) {
                    if (item == null) {
                        continue;
                    }

                    JSONObject json = new JSONObject();
                    json.put("id", item.id);
                    json.put("at", item.at);
                    json.put("prayer", item.prayer);
                    json.put("prayerName", item.prayerName);
                    json.put("title", item.title);
                    json.put("body", item.body);

                    jsonArray.put(json);
                }
            }

            getPreferences(context)
                    .edit()
                    .putString(KEY_ITEMS, jsonArray.toString())
                    .apply();

        } catch (Exception e) {
            Log.e(TAG, "تعذر حفظ تنبيهات ما قبل الأذان", e);
        }
    }

    private static List<Integer> loadScheduledIds(Context context) {
        List<Integer> ids = new ArrayList<>();

        if (context == null) {
            return ids;
        }

        try {
            String rawData = getPreferences(context)
                    .getString(KEY_SCHEDULED_IDS, null);

            if (rawData == null || rawData.trim().isEmpty()) {
                return ids;
            }

            JSONArray jsonArray = new JSONArray(rawData);

            for (int index = 0; index < jsonArray.length(); index++) {
                int id = jsonArray.optInt(index, 0);

                if (id > 0) {
                    ids.add(id);
                }
            }

        } catch (Exception e) {
            Log.e(TAG, "تعذر قراءة معرفات التنبيهات قبل الأذان", e);
        }

        return ids;
    }

    private static void saveScheduledIds(
            Context context,
            List<Integer> ids
    ) {
        if (context == null) {
            return;
        }

        try {
            JSONArray jsonArray = new JSONArray();

            if (ids != null) {
                for (Integer id : ids) {
                    if (id != null && id > 0) {
                        jsonArray.put(id);
                    }
                }
            }

            getPreferences(context)
                    .edit()
                    .putString(KEY_SCHEDULED_IDS, jsonArray.toString())
                    .apply();

        } catch (Exception e) {
            Log.e(TAG, "تعذر حفظ معرفات التنبيهات قبل الأذان", e);
        }
    }

    private static SharedPreferences getPreferences(Context context) {
        return context.getSharedPreferences(
                PREFS_NAME,
                Context.MODE_PRIVATE
        );
    }

    /* ============================== قناة الإشعار ============================== */

    // ✅ تم تعديل القناة لتشغيل الصوت
    public static void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationManager manager =
                context.getSystemService(NotificationManager.class);

        if (manager == null) {
            return;
        }

        NotificationChannel channel = new NotificationChannel(
                PRE_ADHAN_CHANNEL_ID,
                "تنبيه قبل الأذان (صوتي)",
                NotificationManager.IMPORTANCE_HIGH
        );

        channel.setDescription(
                "تنبيه صوتي قبل وقت الأذان"
        );

        // ✅ ربط الصوت المخصص
        AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .build();

        Uri soundUri = Uri.parse(
                android.content.ContentResolver.SCHEME_ANDROID_RESOURCE
                        + "://" + context.getPackageName()
                        + "/" + R.raw.prayer_approaching
        );

        channel.setSound(soundUri, audioAttributes);
        channel.enableVibration(true);

        manager.createNotificationChannel(channel);
    }

    /* ============================== أدوات مساعدة ============================== */

    private static AlarmManager getAlarmManager(Context context) {
        if (context == null) {
            return null;
        }

        return (AlarmManager) context.getSystemService(
                Context.ALARM_SERVICE
        );
    }

    /* ============================== النموذج ============================== */

    public static final class PreAdhanItem {
        public int id;
        public long at;
        public String prayer;
        public String prayerName;
        public String title;
        public String body;
    }

    /* ============================== تحويل JavaScript ============================== */

    private List<PreAdhanItem> parseItems(JSArray array) {
        List<PreAdhanItem> items = new ArrayList<>();

        if (array == null) {
            return items;
        }

        try {
            JSONArray jsonArray = new JSONArray(array.toString());

            for (int index = 0; index < jsonArray.length(); index++) {
                JSONObject json = jsonArray.optJSONObject(index);

                if (json == null) {
                    continue;
                }

                PreAdhanItem item = new PreAdhanItem();
                item.id = json.optInt("id", 0);
                item.at = json.optLong("at", 0L);
                item.prayer = json.optString("prayer", "");
                item.prayerName = json.optString("prayerName", "");
                item.title = json.optString("title", "");
                item.body = json.optString("body", "");

                items.add(item);
            }

        } catch (Exception e) {
            Log.e(TAG, "تعذر تحويل بيانات التنبيه قبل الأذان", e);
        }

        return items;
    }
}