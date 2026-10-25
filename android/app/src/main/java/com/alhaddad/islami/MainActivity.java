package com.alhaddad.islami;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // تسجيل إضافة جدولة الأذان والتذكيرات
        registerPlugin(AdhanSchedulerPlugin.class);

        // تسجيل إضافة تشغيل القرآن - ضرورية جداً
        registerPlugin(QuranPlayerPlugin.class);

        // إنشاء قنوات الإشعارات مبكراً
        NotificationHelper.ensureChannels(this);

        // طلب إذن الإشعارات في Android 13+
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

        // تشغيل شبكة أمان جدولة الأذان
        try {
            AdhanMaintenanceWorker.schedule(this);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}