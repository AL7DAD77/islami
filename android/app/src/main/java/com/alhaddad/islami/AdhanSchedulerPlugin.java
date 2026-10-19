package com.alhaddad.islami;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

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
public class AdhanSchedulerPlugin extends Plugin {

    @PluginMethod
    public void schedule(PluginCall call) {
        Context c = getContext();
        JSArray arr = call.getArray("items");
        Boolean persistent = call.getBoolean("persistent", true);
        String city = call.getString("city", "");

        List<AdhanStore.Item> items = new ArrayList<>();
        if (arr != null) {
            for (int i = 0; i < arr.length(); i++) {
                try {
                    JSONObject o = arr.getJSONObject(i);
                    AdhanStore.Item it = new AdhanStore.Item();
                    it.id = o.optInt("id");
                    it.at = o.optLong("at");
                    it.kind = o.optString("kind", "adhan");
                    it.prayer = o.optString("prayer", "");
                    it.title = o.optString("title", "");
                    it.body = o.optString("body", "");
                    it.file = o.optString("file", "");
                    it.volume = (float) o.optDouble("volume", 0.9);
                    items.add(it);
                } catch (Exception ignored) {
                }
            }
        }

        // تصحيح الخطأ هنا (استخدام ? بدلاً من ||)
        boolean isPersistent = persistent == null ? true : persistent;
        AdhanStore.save(c, items, isPersistent, city);

        NotificationHelper.ensureChannels(c);
        int n = AdhanScheduler.scheduleAll(c);
        NotificationHelper.updatePersistent(c);

        JSObject ret = new JSObject();
        ret.put("scheduled", n);
        ret.put("exactAlarmAllowed", AdhanScheduler.canExact(c));
        call.resolve(ret);
    }

    @PluginMethod
    public void status(PluginCall call) {
        Context c = getContext();
        JSObject ret = new JSObject();
        ret.put("exactAlarmAllowed", AdhanScheduler.canExact(c));
        ret.put("notificationsEnabled", NotificationManagerCompat.from(c).areNotificationsEnabled());
        ret.put("persistent", AdhanStore.isPersistent(c));
        call.resolve(ret);
    }

    @PluginMethod
    public void requestExactAlarm(PluginCall call) {
        Context c = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !AdhanScheduler.canExact(c)) {
            try {
                Intent i = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                i.setData(Uri.parse("package:" + c.getPackageName()));
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                c.startActivity(i);
            } catch (Exception ignored) {
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void setPersistent(PluginCall call) {
        Context c = getContext();
        Boolean enabled = call.getBoolean("enabled", true);
        boolean isEnabled = enabled == null ? true : enabled;
        AdhanStore.setPersistent(c, isEnabled);
        NotificationHelper.updatePersistent(c);
        call.resolve();
    }

    @PluginMethod
    public void stopAdhan(PluginCall call) {
        Context c = getContext();
        try {
            c.stopService(new Intent(c, AdhanService.class));
        } catch (Exception ignored) {
        }
        NotificationHelper.updatePersistent(c);
        call.resolve();
    }

    @PluginMethod
    public void testAdhan(PluginCall call) {
        Integer seconds = call.getInt("seconds", 60);
        String file = call.getString("file", "");
        Double volume = call.getDouble("volume", 0.9);
        AdhanScheduler.scheduleTest(
                getContext(),
                seconds == null ? 60 : seconds,
                file,
                volume == null ? 0.9f : volume.floatValue());
        call.resolve();
    }

    @PluginMethod
    public void requestIgnoreBatteryOptimizations(PluginCall call) {
        Context c = getContext();
        try {
            android.os.PowerManager pm = (android.os.PowerManager) c.getSystemService(Context.POWER_SERVICE);
            if (pm != null && !pm.isIgnoringBatteryOptimizations(c.getPackageName())) {
                Intent intent = new Intent();
                intent.setAction(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(Uri.parse("package:" + c.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                c.startActivity(intent);
            }
        } catch (Exception e) {
            // في حال رفض النظام أو حدوث خطأ
        }
        call.resolve();
    }

    @PluginMethod
    public void checkBatteryOptimization(PluginCall call) {
        Context c = getContext();
        boolean isIgnored = false;
        try {
            android.os.PowerManager pm = (android.os.PowerManager) c.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                isIgnored = pm.isIgnoringBatteryOptimizations(c.getPackageName());
            }
        } catch (Exception e) {
            // تجاهل
        }
        JSObject ret = new JSObject();
        ret.put("isIgnored", isIgnored);
        call.resolve(ret);
    }

    @PluginMethod
    public void cancelAll(PluginCall call) {
        Context c = getContext();
        AdhanScheduler.cancelAll(c);
        call.resolve();
    }
}