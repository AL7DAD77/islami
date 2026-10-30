package com.alhaddad.islami;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SystemSettings")
public class SystemSettingsPlugin extends Plugin {

    private static final String PREFS_NAME = "IslamiSettings";

    @PluginMethod
    public void checkBatteryOptimization(PluginCall call) {
        Context context = getContext();
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        JSObject ret = new JSObject();
        if (pm != null) {
            ret.put("isIgnored", pm.isIgnoringBatteryOptimizations(context.getPackageName()));
        } else {
            ret.put("isIgnored", false);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void requestIgnoreBatteryOptimizations(PluginCall call) {
        Context context = getContext();
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);

        if (pm != null && !pm.isIgnoringBatteryOptimizations(context.getPackageName())) {
            try {
                Intent intent = new Intent();
                intent.setAction(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(Uri.parse("package:" + context.getPackageName()));
                getActivity().startActivity(intent);
                call.resolve();
            } catch (Exception e) {
                try {
                    Intent intent = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                    getActivity().startActivity(intent);
                    call.resolve();
                } catch (Exception ex) {
                    call.reject("Failed to open battery settings");
                }
            }
        } else {
            call.resolve();
        }
    }

    // ✅ الدالة الجديدة: طلب صلاحية الظهور فوق التطبيقات (لحماية الأذان)
    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(context)) {
                try {
                    Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                            Uri.parse("package:" + context.getPackageName()));
                    getActivity().startActivity(intent);
                } catch (Exception e) {
                    call.reject("Failed to open overlay settings", e);
                    return;
                }
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void setPreference(PluginCall call) {
        String key = call.getString("key");
        Boolean value = call.getBoolean("value");
        if (key != null && value != null) {
            SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putBoolean(key, value).apply();
            call.resolve();
        } else {
            call.reject("Missing key or value");
        }
    }

    @PluginMethod
    public void getPreference(PluginCall call) {
        String key = call.getString("key");
        if (key != null) {
            SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            JSObject ret = new JSObject();
            ret.put("value", prefs.getBoolean(key, true));
            call.resolve(ret);
        } else {
            call.reject("Missing key");
        }
    }

    @PluginMethod
    public void setStringPreference(PluginCall call) {
        String key = call.getString("key");
        String value = call.getString("value");
        if (key != null && value != null) {
            SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putString(key, value).apply();
            call.resolve();
        } else {
            call.reject("Missing key or value");
        }
    }

    @PluginMethod
    public void getStringPreference(PluginCall call) {
        String key = call.getString("key");
        if (key != null) {
            SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            JSObject ret = new JSObject();
            ret.put("value", prefs.getString(key, "1"));
            call.resolve(ret);
        } else {
            call.reject("Missing key");
        }
    }
}