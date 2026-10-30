package com.alhaddad.islami;

import android.Manifest;
import android.content.Context;
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

        // 2. تشغيل Capacitor
        super.onCreate(savedInstanceState);

        // ✅ 3. توجيه أزرار الصوت الجانبية للتحكم في صوت الأذان (Alarm) بدلاً من الوسائط
        // هذا يضمن أنه إذا ضغط المستخدم على أزرار الصوت أثناء الأذان، فإنها ستخفض/ترفع صوت الأذان.
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
}