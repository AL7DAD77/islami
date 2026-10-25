package com.alhaddad.islami;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;

import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "AdhanScheduler")
public final class AdhanSchedulerPlugin extends Plugin {

    private static final String TAG = "AdhanSchedulerPlugin";

    private static final String KEY_ITEMS = "items";
    private static final String KEY_PERSISTENT = "persistent";
    private static final String KEY_CITY = "city";
    private static final String KEY_ENABLED = "enabled";

    private static final String KEY_ID = "id";
    private static final String KEY_AT = "at";
    private static final String KEY_KIND = "kind";
    private static final String KEY_PRAYER = "prayer";
    private static final String KEY_TITLE = "title";
    private static final String KEY_BODY = "body";
    private static final String KEY_FILE = "file";
    private static final String KEY_VOLUME = "volume";

    private static final String KEY_SCHEDULED = "scheduled";
    private static final String KEY_EXACT_ALARM_ALLOWED = "exactAlarmAllowed";
    private static final String KEY_NOTIFICATIONS_ENABLED = "notificationsEnabled";
    private static final String KEY_IS_IGNORED = "isIgnored";

    private static final String KIND_ADHAN = "adhan";

    private static final int DEFAULT_TEST_SECONDS = 60;
    private static final float DEFAULT_ADHAN_VOLUME = 0.9f;

    @PluginMethod
    public void schedule(PluginCall call) {
        Context context = getContext();
        if (context == null) { call.reject("Context غير متاح"); return; }

        JSArray itemsArray = call.getArray(KEY_ITEMS);
        boolean persistent = call.getBoolean(KEY_PERSISTENT, true);
        String city = call.getString(KEY_CITY, "");

        List<AdhanStore.Item> items = parseScheduledItems(itemsArray);
        AdhanStore.save(context, items, persistent, city == null ? "" : city);

        NotificationHelper.ensureChannels(context);
        int scheduledCount = AdhanScheduler.scheduleAll(context);
        NotificationHelper.updatePersistent(context);

        try {
            AdhanMaintenanceWorker.schedule(context);
        } catch (Exception e) {
            Log.w(TAG, "تعذر بدء شبكة أمان الجدولة (WorkManager)", e);
        }

        JSObject result = new JSObject();
        result.put(KEY_SCHEDULED, scheduledCount);
        result.put(KEY_EXACT_ALARM_ALLOWED, AdhanScheduler.canScheduleExactAlarms(context));
        call.resolve(result);
    }

    @PluginMethod
    public void status(PluginCall call) {
        Context context = getContext();
        if (context == null) { call.reject("Context غير متاح"); return; }

        JSObject result = new JSObject();
        result.put(KEY_EXACT_ALARM_ALLOWED, AdhanScheduler.canScheduleExactAlarms(context));
        result.put(KEY_NOTIFICATIONS_ENABLED, NotificationManagerCompat.from(context).areNotificationsEnabled());
        result.put(KEY_PERSISTENT, AdhanStore.isPersistent(context));
        call.resolve(result);
    }

    @PluginMethod
    public void requestExactAlarm(PluginCall call) {
        Context context = getContext();
        if (context == null) { call.reject("Context غير متاح"); return; }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !AdhanScheduler.canScheduleExactAlarms(context)) {
            openExactAlarmSettings(context, call);
        } else {
            call.resolve();
        }
    }

    private void openExactAlarmSettings(Context context, PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
            intent.setData(Uri.parse("package:" + context.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("تعذر فتح إعدادات التنبيهات الدقيقة", e);
        }
    }

    @PluginMethod
    public void setPersistent(PluginCall call) {
        Context context = getContext();
        if (context == null) { call.reject("Context غير متاح"); return; }
        boolean enabled = call.getBoolean(KEY_ENABLED, true);
        AdhanStore.setPersistent(context, enabled);
        NotificationHelper.updatePersistent(context);
        call.resolve();
    }

    @PluginMethod
    public void stopAdhan(PluginCall call) {
        Context context = getContext();
        if (context == null) { call.reject("Context غير متاح"); return; }
        try {
            context.stopService(new Intent(context, AdhanService.class));
        } catch (Exception e) {
            call.reject("تعذر إيقاف خدمة الأذان", e);
            return;
        }
        NotificationHelper.updatePersistent(context);
        call.resolve();
    }

    @PluginMethod
    public void testAdhan(PluginCall call) {
        Context context = getContext();
        if (context == null) { call.reject("Context غير متاح"); return; }

        Integer seconds = call.getInt("seconds", DEFAULT_TEST_SECONDS);
        String file = call.getString("file", "");
        Double volume = call.getDouble("volume", (double) DEFAULT_ADHAN_VOLUME);

        int testDelaySeconds = seconds == null ? DEFAULT_TEST_SECONDS : seconds;
        float testVolume = volume == null ? DEFAULT_ADHAN_VOLUME : volume.floatValue();

        AdhanScheduler.scheduleTest(context, testDelaySeconds, file == null ? "" : file, testVolume);
        call.resolve();
    }

    @PluginMethod
    public void requestIgnoreBatteryOptimizations(PluginCall call) {
        Context context = getContext();
        if (context == null) { call.reject("Context غير متاح"); return; }

        PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        if (powerManager == null || powerManager.isIgnoringBatteryOptimizations(context.getPackageName())) {
            call.resolve();
            return;
        }

        try {
            Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
            intent.setData(Uri.parse("package:" + context.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } catch (Exception e) {
            call.reject("تعذر فتح إعدادات تحسين البطارية", e);
            return;
        }
        call.resolve();
    }

    @PluginMethod
    public void checkBatteryOptimization(PluginCall call) {
        Context context = getContext();
        if (context == null) { call.reject("Context غير متاح"); return; }

        boolean isIgnored = false;
        try {
            PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (powerManager != null) {
                isIgnored = powerManager.isIgnoringBatteryOptimizations(context.getPackageName());
            }
        } catch (Exception e) {
            call.reject("تعذر فحص حالة تحسين البطارية", e);
            return;
        }

        JSObject result = new JSObject();
        result.put(KEY_IS_IGNORED, isIgnored);
        call.resolve(result);
    }

    @PluginMethod
    public void cancelAll(PluginCall call) {
        Context context = getContext();
        if (context == null) { call.reject("Context غير متاح"); return; }
        try {
            AdhanScheduler.cancelAll(context);
        } catch (Exception e) {
            call.reject("تعذر إلغاء جميع التنبيهات", e);
            return;
        }
        call.resolve();
    }

    private List<AdhanStore.Item> parseScheduledItems(JSArray itemsArray) {
        List<AdhanStore.Item> items = new ArrayList<>();
        if (itemsArray == null) return items;

        for (int index = 0; index < itemsArray.length(); index++) {
            try {
                JSONObject itemJson = itemsArray.getJSONObject(index);
                AdhanStore.Item item = parseItem(itemJson);
                if (item != null) items.add(item);
            } catch (Exception e) {
                continue;
            }
        }
        return items;
    }

    private AdhanStore.Item parseItem(JSONObject json) {
        if (json == null) return null;

        int id = json.optInt(KEY_ID, 0);
        long at = json.optLong(KEY_AT, 0);
        if (id <= 0 || at <= 0) return null;

        AdhanStore.Item item = new AdhanStore.Item();
        item.id = id;
        item.at = at;
        item.kind = json.optString(KEY_KIND, KIND_ADHAN);
        item.prayer = json.optString(KEY_PRAYER, "");
        item.title = json.optString(KEY_TITLE, "");
        item.body = json.optString(KEY_BODY, "");
        item.file = json.optString(KEY_FILE, "");
        item.volume = (float) json.optDouble(KEY_VOLUME, DEFAULT_ADHAN_VOLUME);
        return item;
    }
}