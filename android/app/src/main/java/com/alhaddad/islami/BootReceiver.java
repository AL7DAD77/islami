package com.alhaddad.islami;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** يعيد جدولة الأذان بعد إعادة تشغيل الهاتف أو تحديث التطبيق أو تغيير الوقت/المنطقة الزمنية. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        AdhanScheduler.scheduleAll(context);
        NotificationHelper.updatePersistent(context);
    }
}
