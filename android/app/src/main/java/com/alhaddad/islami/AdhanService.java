package com.alhaddad.islami;

import android.app.Notification;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.annotation.Nullable;

/**
 * AdhanService
 * خدمة أمامية مسؤولة عن تشغيل صوت الأذان.
 */
public final class AdhanService extends Service {

    private static final String TAG = "AdhanService";

    public static final String ACTION_STOP_ADHAN =
            "com.alhaddad.islami.STOP_ADHAN";

    private static final String EXTRA_FILE = "file";
    private static final String EXTRA_VOLUME = "volume";
    private static final String EXTRA_TITLE = "title";
    private static final String EXTRA_BODY = "body";

    private static final String DEFAULT_TITLE = "حان وقت الأذان";
    private static final String DEFAULT_BODY = "حي على الصلاة، حي على الفلاح";

    private MediaPlayer mediaPlayer;

    @Override
    public void onCreate() {
        super.onCreate();
        mediaPlayer = createMediaPlayer();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            stopPlayback();
            return START_NOT_STICKY;
        }

        String action = intent.getAction();

        if (ACTION_STOP_ADHAN.equals(action)) {
            stopPlayback();
            return START_NOT_STICKY;
        }

        String fileName = intent.getStringExtra(EXTRA_FILE);
        float volume = intent.getFloatExtra(EXTRA_VOLUME, 1.0f);
        String title = intent.getStringExtra(EXTRA_TITLE);
        String body = intent.getStringExtra(EXTRA_BODY);

        if (fileName == null || fileName.trim().isEmpty()) {
            Log.e(TAG, "لم يتم توفير ملف صوتي للأذان");
            stopPlayback();
            return START_NOT_STICKY;
        }

        Notification notification = NotificationHelper.buildPlaying(
                this,
                title == null || title.trim().isEmpty() ? DEFAULT_TITLE : title,
                body == null || body.trim().isEmpty() ? DEFAULT_BODY : body
        );

        startForegroundWithType(notification);
        playAdhan(fileName, volume);

        return START_NOT_STICKY;
    }

    /* ============================ تشغيل الأذان ============================ */

    private void playAdhan(String fileName, float volume) {
        try {
            if (mediaPlayer == null) {
                mediaPlayer = createMediaPlayer();
            }
            mediaPlayer.reset();

            // ✅ الطريقة الرسمية والآمنة لقراءة الملفات من مجلد assets في أندرويد
            // الملفات موجودة في: android/app/src/main/assets/public/audio/adhans/
            AssetFileDescriptor afd = getAssets().openFd("public/audio/adhans/" + fileName);
            mediaPlayer.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            afd.close();

            mediaPlayer.setVolume(volume, volume);

            mediaPlayer.setOnPreparedListener(player -> {
                try {
                    player.start();
                } catch (Exception e) {
                    Log.e(TAG, "تعذر بدء تشغيل الأذان", e);
                    stopPlayback();
                }
            });

            mediaPlayer.setOnCompletionListener(player -> {
                Log.i(TAG, "انتهى تشغيل الأذان");
                stopPlayback();
            });

            mediaPlayer.setOnErrorListener((player, what, extra) -> {
                Log.e(TAG, "خطأ في مشغل الأذان: what=" + what + ", extra=" + extra);
                stopPlayback();
                return true;
            });

            mediaPlayer.prepareAsync();

        } catch (Exception e) {
            Log.e(TAG, "خطأ في تحميل ملف الأذان: " + fileName, e);
            stopPlayback();
        }
    }

    /* ============================ إيقاف الأذان ============================ */

    private void stopPlayback() {
        try {
            if (mediaPlayer != null) {
                mediaPlayer.setOnCompletionListener(null);
                mediaPlayer.setOnErrorListener(null);
                mediaPlayer.setOnPreparedListener(null);

                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }

                mediaPlayer.reset();
            }
        } catch (Exception e) {
            Log.w(TAG, "خطأ أثناء إيقاف مشغل الأذان", e);
        } finally {
            stopForegroundService();
            stopSelf();
            NotificationHelper.updatePersistent(this);
        }
    }

    private void stopForegroundService() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE);
        } else {
            stopForeground(true);
        }
    }

    /* ============================ الخدمة الأمامية ============================ */

    private void startForegroundWithType(Notification notification) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(
                    NotificationHelper.ID_PLAYING,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            );
            return;
        }

        startForeground(NotificationHelper.ID_PLAYING, notification);
    }

    /* ============================ إنشاء المشغل ============================ */

    private MediaPlayer createMediaPlayer() {
        MediaPlayer player = new MediaPlayer();
        
        // ✅ تغيير النوع إلى ALARM لكي يصدح الأذان حتى لو كان الهاتف في الوضع الصامت
        player.setAudioAttributes(
                new AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .setUsage(AudioAttributes.USAGE_ALARM) 
                        .build()
        );
        return player;
    }

    /* ============================ دورة الحياة ============================ */

    @Override
    public void onDestroy() {
        releaseMediaPlayer();
        stopForegroundService();
        super.onDestroy();
    }

    private void releaseMediaPlayer() {
        if (mediaPlayer == null) return;
        try {
            mediaPlayer.release();
        } catch (Exception e) {
            Log.w(TAG, "خطأ أثناء تحرير مشغل الأذان", e);
        } finally {
            mediaPlayer = null;
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}