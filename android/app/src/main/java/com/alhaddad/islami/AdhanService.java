package com.alhaddad.islami;

import android.app.Notification;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ServiceInfo;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
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

    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;

    private final AudioManager.OnAudioFocusChangeListener audioFocusListener =
            new AudioManager.OnAudioFocusChangeListener() {
                @Override
                public void onAudioFocusChange(int focusChange) {
                    if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT && mediaPlayer != null) {
                        try {
                            mediaPlayer.setVolume(0.2f, 0.2f);
                        } catch (Exception e) {
                            Log.w(TAG, "خطأ في خفض الصوت عند فقدان التركيز المؤقت", e);
                        }
                    } else if (focusChange == AudioManager.AUDIOFOCUS_GAIN && mediaPlayer != null) {
                        try {
                            mediaPlayer.setVolume(1.0f, 1.0f);
                        } catch (Exception e) {
                            Log.w(TAG, "خطأ في استعادة الصوت بعد استعادة التركيز", e);
                        }
                    }
                }
            };

    private final BroadcastReceiver screenStateReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (Intent.ACTION_SCREEN_OFF.equals(action) || Intent.ACTION_SCREEN_ON.equals(action)) {
                Log.i(TAG, "تم تغيير حالة الشاشة - جاري إسكات الأذان");
                stopPlayback();
            }
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        mediaPlayer = createMediaPlayer();
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);

        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_SCREEN_OFF);
        filter.addAction(Intent.ACTION_SCREEN_ON);
        registerReceiver(screenStateReceiver, filter);
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

    private void playAdhan(String fileName, float volume) {
        try {
            if (mediaPlayer == null) {
                mediaPlayer = createMediaPlayer();
            }
            mediaPlayer.reset();

            requestAudioFocus();

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

    private void requestAudioFocus() {
        try {
            if (audioManager == null) {
                audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            }
            if (audioManager == null) return;

            AudioAttributes attributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build();

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                        .setAudioAttributes(attributes)
                        .setAcceptsDelayedFocusGain(true)
                        .setOnAudioFocusChangeListener(audioFocusListener)
                        .build();
                audioManager.requestAudioFocus(audioFocusRequest);
            } else {
                audioManager.requestAudioFocus(
                        audioFocusListener,
                        AudioManager.STREAM_ALARM,
                        AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
                );
            }

            audioManager.adjustStreamVolume(
                    AudioManager.STREAM_ALARM,
                    AudioManager.ADJUST_SAME,
                    0
            );

            Log.i(TAG, "تم طلب AudioFocus وتوجيه أزرار الصوت إلى STREAM_ALARM");
        } catch (Exception e) {
            Log.e(TAG, "خطأ في طلب AudioFocus", e);
        }
    }

    private void abandonAudioFocus() {
        try {
            if (audioManager == null) return;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
                audioManager.abandonAudioFocusRequest(audioFocusRequest);
                audioFocusRequest = null;
            } else {
                audioManager.abandonAudioFocus(audioFocusListener);
            }
        } catch (Exception e) {
            Log.w(TAG, "خطأ في تحرير AudioFocus", e);
        }
    }

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
            abandonAudioFocus();

            stopForegroundService();
            stopSelf();

            NotificationHelper.updatePersistent(this);

            // ✅ الإضافة الحاسمة: جدولة الصلاة التالية بعد انتهاء الأذان
            AdhanScheduler.scheduleNextAdhan(this);
        }
    }

    private void stopForegroundService() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE);
        } else {
            stopForeground(true);
        }
    }

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

    private MediaPlayer createMediaPlayer() {
        MediaPlayer player = new MediaPlayer();
        player.setAudioAttributes(
                new AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .build()
        );
        return player;
    }

    @Override
    public void onDestroy() {
        try {
            unregisterReceiver(screenStateReceiver);
        } catch (Exception e) {
            Log.w(TAG, "تمت محاولة إلغاء تسجيل مستقبل غير مسجل", e);
        }

        abandonAudioFocus();

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