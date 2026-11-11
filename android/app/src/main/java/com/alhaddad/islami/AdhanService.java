package com.alhaddad.islami;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ServiceInfo;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;

public final class AdhanService extends android.app.Service {

    private static final String TAG = "AdhanService";
    public static final String ACTION_STOP_ADHAN = "com.alhaddad.islami.STOP_ADHAN";

    // ⚠️ ميزة الإيقاف عند إطفاء الشاشة: معطلة (false) لأنها كانت تسبب مشاكل
    private static final boolean STOP_ON_SCREEN_OFF = false;
    private static final long WAKE_LOCK_TIMEOUT_MS = 10 * 60 * 1000L;

    private static final String EXTRA_FILE = "file";
    private static final String EXTRA_VOLUME = "volume";
    private static final String EXTRA_TITLE = "title";
    private static final String EXTRA_BODY = "body";

    private static final String ASSET_DIR = "public/audio/adhans/";
    private static final String DEFAULT_TITLE = "حان وقت الأذان";
    private static final String DEFAULT_BODY = "حي على الصلاة، حي على الفلاح";

    private MediaPlayer mediaPlayer;
    private AssetFileDescriptor currentAfd;
    private PowerManager.WakeLock wakeLock;
    private boolean screenReceiverRegistered = false;
    private boolean foregroundActive = false;
    private float playbackVolume = 1.0f;

    // مستقبل إطفاء الشاشة (معطل حالياً)
    private final BroadcastReceiver screenOffReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent != null && Intent.ACTION_SCREEN_OFF.equals(intent.getAction())) {
                if (STOP_ON_SCREEN_OFF) {
                    Log.i(TAG, "تم إطفاء الشاشة، إيقاف الأذان");
                    stopPlayback(false);
                }
            }
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        mediaPlayer = createMediaPlayer();

        if (STOP_ON_SCREEN_OFF && !screenReceiverRegistered) {
            ContextCompat.registerReceiver(
                    this,
                    screenOffReceiver,
                    new IntentFilter(Intent.ACTION_SCREEN_OFF),
                    ContextCompat.RECEIVER_NOT_EXPORTED
            );
            screenReceiverRegistered = true;
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || ACTION_STOP_ADHAN.equals(intent.getAction())) {
            startForegroundSafely(NotificationHelper.buildPlaying(this, DEFAULT_TITLE, DEFAULT_BODY));
            stopPlayback(true);
            return START_NOT_STICKY;
        }

        String fileName = intent.getStringExtra(EXTRA_FILE);
        float volume = clampVolume(intent.getFloatExtra(EXTRA_VOLUME, 1.0f));
        String title = nonEmptyOr(intent.getStringExtra(EXTRA_TITLE), DEFAULT_TITLE);
        String body = nonEmptyOr(intent.getStringExtra(EXTRA_BODY), DEFAULT_BODY);

        startForegroundSafely(NotificationHelper.buildPlaying(this, title, body));
        acquireWakeLock();

        if (fileName == null || fileName.trim().isEmpty()) {
            Log.e(TAG, "لم يتم توفير ملف صوتي للأذان");
            stopPlayback(true);
            return START_NOT_STICKY;
        }

        playAdhan(fileName.trim(), volume);
        return START_NOT_STICKY;
    }

    private void playAdhan(String fileName, float volume) {
        playbackVolume = volume;

        try {
            MediaPlayer player = ensureMediaPlayer();
            player.reset();

            closeCurrentAfd();

            // ✅ لا يوجد AudioFocus هنا! هذا هو الحل لمشكلة الصوت الصامت.
            // USAGE_ALARM وحده يعطي الأولوية القصوى للصوت.

            currentAfd = getAssets().openFd(ASSET_DIR + fileName);
            Log.i(TAG, "محاولة تشغيل الملف: " + ASSET_DIR + fileName);

            player.setDataSource(
                    currentAfd.getFileDescriptor(),
                    currentAfd.getStartOffset(),
                    currentAfd.getLength()
            );
            player.setVolume(volume, volume);

            player.setOnPreparedListener(preparedPlayer -> {
                try {
                    preparedPlayer.start();
                    Log.i(TAG, "بدأ تشغيل الأذان بنجاح");
                } catch (Exception e) {
                    Log.e(TAG, "تعذر بدء تشغيل الأذان", e);
                    stopPlayback(true);
                }
            });

            player.setOnCompletionListener(completedPlayer -> {
                Log.i(TAG, "انتهى تشغيل الأذان");
                stopPlayback(true);
            });

            player.setOnErrorListener((errorPlayer, what, extra) -> {
                Log.e(TAG, "خطأ في مشغل الأذان: what=" + what + ", extra=" + extra);
                stopPlayback(true);
                return true;
            });

            player.prepareAsync();

        } catch (Exception e) {
            Log.e(TAG, "خطأ في تحميل ملف الأذان: " + fileName, e);
            stopPlayback(true);
        }
    }

    private void stopPlayback(boolean scheduleNext) {
        try {
            MediaPlayer player = mediaPlayer;
            if (player != null) {
                player.setOnCompletionListener(null);
                player.setOnErrorListener(null);
                player.setOnPreparedListener(null);
                if (player.isPlaying()) {
                    player.stop();
                }
                player.reset();
            }
        } catch (Exception e) {
            Log.w(TAG, "خطأ أثناء إيقاف المشغل", e);
            releaseMediaPlayer();
        } finally {
            closeCurrentAfd();
            releaseWakeLock();
            stopForegroundCompat();
            stopSelf();
            NotificationHelper.updatePersistent(this);
            if (scheduleNext) {
                AdhanScheduler.scheduleNextAdhan(this);
            }
        }
    }

    @SuppressLint("NewApi")
    private void startForegroundSafely(Notification notification) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(
                        NotificationHelper.ID_PLAYING,
                        notification,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
                );
            } else {
                startForeground(NotificationHelper.ID_PLAYING, notification);
            }
            foregroundActive = true;
        } catch (Exception e) {
            Log.e(TAG, "تعذر بدء الخدمة الأمامية بالنوع المحدد", e);
            try {
                startForeground(NotificationHelper.ID_PLAYING, notification);
                foregroundActive = true;
            } catch (Exception ex) {
                Log.e(TAG, "تعذر بدء الخدمة الأمامية نهائياً", ex);
            }
        }
    }

    @SuppressLint("NewApi")
    private void stopForegroundCompat() {
        if (!foregroundActive) return;
        foregroundActive = false;
        try {
            stopForeground(STOP_FOREGROUND_REMOVE);
        } catch (Exception e) {
            Log.w(TAG, "خطأ أثناء إيقاف الخدمة الأمامية", e);
        }
    }

    private void acquireWakeLock() {
        try {
            if (wakeLock == null) {
                PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
                if (pm == null) return;
                wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, TAG + ":adhan");
                wakeLock.setReferenceCounted(false);
            }
            if (!wakeLock.isHeld()) {
                wakeLock.acquire(WAKE_LOCK_TIMEOUT_MS);
            }
        } catch (Exception e) {
            Log.w(TAG, "تعذر أخذ قفل الاستيقاظ", e);
        }
    }

    private void releaseWakeLock() {
        try {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
            }
        } catch (Exception e) {
            Log.w(TAG, "تعذر تحرير قفل الاستيقاظ", e);
        }
    }

    private void closeCurrentAfd() {
        if (currentAfd == null) return;
        try {
            currentAfd.close();
        } catch (Exception ignored) {}
        currentAfd = null;
    }

    private MediaPlayer ensureMediaPlayer() {
        if (mediaPlayer == null) mediaPlayer = createMediaPlayer();
        return mediaPlayer;
    }

    private MediaPlayer createMediaPlayer() {
        MediaPlayer player = new MediaPlayer();
        player.setAudioAttributes(adhanAudioAttributes());
        return player;
    }

    private static AudioAttributes adhanAudioAttributes() {
        return new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build();
    }

    private void releaseMediaPlayer() {
        MediaPlayer player = mediaPlayer;
        mediaPlayer = null;
        if (player == null) return;
        try {
            player.release();
        } catch (Exception e) {
            Log.w(TAG, "خطأ أثناء تحرير المشغل", e);
        }
    }

    private static float clampVolume(float volume) {
        if (Float.isNaN(volume) || volume <= 0f) return 1.0f;
        return Math.min(volume, 1.0f);
    }

    private static String nonEmptyOr(String value, String fallback) {
        return (value == null || value.trim().isEmpty()) ? fallback : value;
    }

    @Override
    public void onDestroy() {
        if (screenReceiverRegistered) {
            try {
                unregisterReceiver(screenOffReceiver);
            } catch (Exception e) {
                Log.w(TAG, "تعذر إلغاء تسجيل المستقبل", e);
            }
            screenReceiverRegistered = false;
        }
        closeCurrentAfd();
        releaseWakeLock();
        releaseMediaPlayer();
        stopForegroundCompat();
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}