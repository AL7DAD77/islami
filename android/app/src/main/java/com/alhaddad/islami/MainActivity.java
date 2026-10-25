package com.alhaddad.islami;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. التأكد من إنشاء قنوات الإشعارات مبكراً
        NotificationHelper.ensureChannels(this);

        // 2. تشغيل شبكة الأمان (WorkManager) للتأكد من بقاء الجدولة تعمل
        // حتى لو أغلق النظام التطبيق أو قتل العمليات في الخلفية
        try {
            AdhanMaintenanceWorker.schedule(this);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}