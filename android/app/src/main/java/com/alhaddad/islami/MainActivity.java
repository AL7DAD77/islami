package com.alhaddad.islami;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // تسجيل إضافة جدولة الأذان قبل إنشاء الـ Bridge
        registerPlugin(AdhanSchedulerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
