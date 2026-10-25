package com.alhaddad.islami;

import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.Constraints;
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

            NotificationHelper.ensureChannels(context);
            NotificationHelper.updatePersistent(context);
            AdhanScheduler.scheduleNextAdhan(context);

            Log.i(TAG, "تم فحص الجدولة بنجاح عبر شبكة الأمان");
            return Result.success();

        } catch (Exception e) {
            Log.e(TAG, "فشل فحص الجدولة، سيتم إعادة المحاولة", e);
            return Result.retry();
        }
    }

    public static void schedule(Context context) {
        Constraints constraints = new Constraints.Builder()
                .setRequiresBatteryNotLow(true)
                .build();

        PeriodicWorkRequest request =
                new PeriodicWorkRequest.Builder(
                        AdhanMaintenanceWorker.class,
                        6,
                        TimeUnit.HOURS
                )
                        .setConstraints(constraints)
                        .build();

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request
        );
    }
}