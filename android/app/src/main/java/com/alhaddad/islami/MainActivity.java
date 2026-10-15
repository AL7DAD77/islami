package com.alhaddad.islami;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // إضافة الأذان الحالية: باقية دون حذف.
        registerPlugin(AdhanSchedulerPlugin.class);

        // إضافة مشغّل القرآن الجديدة.
        registerPlugin(QuranPlayerPlugin.class);

        super.onCreate(savedInstanceState);
    }
}