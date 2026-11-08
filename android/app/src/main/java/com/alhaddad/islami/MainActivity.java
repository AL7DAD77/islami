package com.alhaddad.islami;

import android.Manifest;
import android.content.pm.PackageManager;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {

        // 1. تسجيل الإضافات قبل super.onCreate - ضروري جداً
        registerPlugin(AdhanSchedulerPlugin.class);
        registerPlugin(QuranPlayerPlugin.class);
        registerPlugin(SystemSettingsPlugin.class);
        registerPlugin(PreAdhanScheduler.class);

        // 2. تشغيل Capacitor
        super.onCreate(savedInstanceState);

        // ✅ 3. توجيه أزرار الصوت الجانبية للتحكم في صوت الأذان (Alarm)
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

    // ✅ 7. التحكم في زر الرجوع
    @Override
    public void onBackPressed() {
        if (getBridge() != null) {
            // نرسل حدث "backButton" إلى JavaScript
            // React سيقرر: هل يرجع صفحة داخلية؟ أم يغلق التطبيق؟
            getBridge().triggerJSEvent("backButton", "window");
        } else {
            // إذا لم يكن هناك جسر، اخرج من التطبيق
            super.onBackPressed();
        }
    }
}