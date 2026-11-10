package com.alhaddad.islami;

import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import java.util.concurrent.TimeUnit;

public final class AdhanMaintenanceWorker extends Worker {

    private static final String TAG = "AdhanMaintenanceWorker";
    private static final String WORK_NAME = "adhan_maintenance_worker";

    public AdhanMaintenanceWorker(
            @NonNull Context context,
            @NonNull WorkerParameters params
    ) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        try {
            Context context = getApplicationContext();

            // 1. التأكد من قنوات الإشعارات
            NotificationHelper.ensureChannels(context);
            
            // 2. تحديث الإشعار الدائم والعداد بشكل دوري وفوري
            NotificationHelper.updatePersistent(context);
            
            // 3. إعادة فحص وجدولة الأذان القادم لضمان عدم تفويت أي صلاة
            AdhanScheduler.scheduleNextAdhan(context);

            Log.i(TAG, "تم تحديث الإشعار الدائم والجدولة بنجاح عبر شبكة الأمان");
            return Result.success();

        } catch (Exception e) {
            Log.e(TAG, "فشل صيانة الجدولة والعداد، سيتم إعادة المحاولة", e);
            return Result.retry();
        }
    }

    public static void schedule(Context context) {
        // تم تقليص الفترة إلى 15 دقيقة (وهي الحد الأدنى المسموح به نظامياً) 
        // لضمان بقاء العداد والوقت المتبقي متحدثين باستمرار في الخلفية دون انتظار ساعات طويلة.
        PeriodicWorkRequest request =
                new PeriodicWorkRequest.Builder(
                        AdhanMaintenanceWorker.class,
                        15,
                        TimeUnit.MINUTES
                ).build();

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.UPDATE,
                request
        );
    }
}
