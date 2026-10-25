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

        // 1. ✅ تسجيل الـ Plugin (ضروري جداً لكي يعمل الاتصال مع React)
        // لاحظ أن الاسم هنا مطابق لاسم الملف الذي أرسلته لي: AdhanSchedulerPlugin
        registerPlugin(AdhanSchedulerPlugin.class);

        // 2. التأكد من إنشاء قنوات الإشعارات مبكراً
        NotificationHelper.ensureChannels(this);

        // 3. ✅ طلب صلاحية الإشعارات من المستخدم (ضروري لأندرويد 13 وما فوق)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) 
                != PackageManager.PERMISSION_GRANTED) {
                
                ActivityCompat.requestPermissions(this, 
                    new String[]{Manifest.permission.POST_NOTIFICATIONS}, 101);
            }
        }

        // 4. تشغيل شبكة الأمان (WorkManager) للتأكد من بقاء الجدولة تعمل
        try {
            AdhanMaintenanceWorker.schedule(this);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}