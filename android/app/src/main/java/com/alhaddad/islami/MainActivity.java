package com.alhaddad.islami;

import android.Manifest;
import android.content.pm.PackageManager;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {

        // 1. تسجيل الإضافات قبل super.onCreate
        registerPlugin(AdhanSchedulerPlugin.class);
        registerPlugin(QuranPlayerPlugin.class);
        registerPlugin(SystemSettingsPlugin.class);
        registerPlugin(PreAdhanScheduler.class);
        registerPlugin(AppExitPlugin.class);

        // 2. تشغيل Capacitor
        super.onCreate(savedInstanceState);

        // 3. توجيه أزرار الصوت الجانبية للتحكم في صوت الأذان (Alarm)
        setVolumeControlStream(AudioManager.STREAM_ALARM);

        // 4. إنشاء قنوات الإشعارات
        NotificationHelper.ensureChannels(this);

        // 5. طلب إذن الإشعارات في Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
            ) != PackageManager.PERMISSION_GRANTED) {

                ActivityCompat.requestPermissions(
                        this,
                        new String[]{Manifest.permission.POST_NOTIFICATIONS},
                        101
                );
            }
        }

        // 6. تشغيل شبكة أمان جدولة الأذان
        try {
            AdhanMaintenanceWorker.schedule(this);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // ✅ 7. اعتراض زر الرجوع
    // نترك Capacitor يرسل الحدث إلى React (NativeBackHandler)
    @Override
    public void onBackPressed() {
        // نرسل الحدث إلى React، وهو سيتخذ القرار
        if (getBridge() != null) {
            getBridge().triggerJSEvent("backButton", "window");
        } else {
            // احتياطي: نقل التطبيق للخلفية
            moveTaskToBack(true);
        }
    }

    // ✅ 8. إضافة AppExit لنقل التطبيق للخلفية
    @CapacitorPlugin(name = "AppExit")
    public static class AppExitPlugin extends Plugin {
        @PluginMethod
        public void exit(PluginCall call) {
            // moveTaskToBack(true) ينقل التطبيق للخلفية دون قتله
            getActivity().moveTaskToBack(true);
            call.resolve(new JSObject());
        }
    }
}