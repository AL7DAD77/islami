package com.alhaddad.islami;

import android.app.Notification;
import android.app.Service;
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
import androidx.core.content.ContextCompat;

/**
 * AdhanService
 * خدمة أمامية مسؤولة عن تشغيل صوت الأذان.
 * يتوقف الأذان عند إطفاء الشاشة (زر الباور).
 */
public final class AdhanService extends Service {

    private static final String TAG = "AdhanService";

    public static final String ACTION_STOP_ADHAN = "com.alhaddad.islami.STOP_ADHAN";

    private static final String EXTRA_FILE = "file";
    private static final String EXTRA_VOLUME = "volume";
    private static final String EXTRA_TITLE = "title";
    private static final String EXTRA_BODY = "body";

    private static final String DEFAULT_TITLE = "حان وقت الأذان";
    private static final String DEFAULT_BODY = "حي على الصلاة، حي على الفلاح";

    private MediaPlayer mediaPlayer;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private boolean screenReceiverRegistered = false;

    // ✅ إبقاء مرجع لـ AssetFileDescriptor مفتوحاً حتى ينتهي التشغيل
    private AssetFileDescriptor currentAfd = null;

    private final AudioManager.OnAudioFocusChangeListener audioFocusListener =
            new AudioManager.OnAudioFocusChangeListener() {
                @Override
                public void onAudioFocusChange(int focusChange) {
                    if (mediaPlayer == null) return;
                    try {
                        if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
                            mediaPlayer.setVolume(0.2f, 0.2f);
                        } else if (focusChange == AudioManager.AUDIOFOCUS_GAIN) {
                            mediaPlayer.setVolume(1.0f, 1.0f);
                        }
                    } catch (Exception e) {
                        Log.w(TAG, "خطأ في تغيير مستوى الصوت حسب التركيز", e);
                    }
                }
            };

    private final android.content.BroadcastReceiver screenOffReceiver =
            new android.content.BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    if (intent != null && Intent.ACTION_SCREEN_OFF.equals(intent.getAction())) {
                        Log.i(TAG, "تم إطفاء الشاشة، إيقاف الأذان فوراً");
                        stopPlayback(true);
                    }
                }
            };

    @Override
    public void onCreate() {
        super.onCreate();
        mediaPlayer = createMediaPlayer();
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);

        if (!screenReceiverRegistered) {
            IntentFilter filter = new IntentFilter(Intent.ACTION_SCREEN_OFF);
            ContextCompat.registerReceiver(
                    this,
                    screenOffReceiver,
                    filter,
                    ContextCompat.RECEIVER_NOT_EXPORTED
            );
            screenReceiverRegistered = true;
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || ACTION_STOP_ADHAN.equals(intent.getAction())) {
            startForegroundWithType(NotificationHelper.buildPlaying(this, DEFAULT_TITLE, DEFAULT_BODY));
            stopPlayback(true);
            return START_NOT_STICKY;
        }

        String fileName = intent.getStringExtra(EXTRA_FILE);
        float volume = intent.getFloatExtra(EXTRA_VOLUME, 1.0f);
        String title = intent.getStringExtra(EXTRA_TITLE);
        String body = intent.getStringExtra(EXTRA_BODY);

        Notification notification = NotificationHelper.buildPlaying(
                this,
                title == null || title.trim().isEmpty() ? DEFAULT_TITLE : title,
                body == null || body.trim().isEmpty() ? DEFAULT_BODY : body
        );
        startForegroundWithType(notification);

        if (fileName == null || fileName.trim().isEmpty()) {
            Log.e(TAG, "لم يتم توفير ملف صوتي للأذان");
            stopPlayback(true);
            return START_NOT_STICKY;
        }

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

            // ✅ إغلاق أي AFD سابق قبل فتح جديد
            closeCurrentAfd();

            currentAfd = getAssets().openFd("public/audio/adhans/" + fileName);

            mediaPlayer.setDataSource(
                    currentAfd.getFileDescriptor(),
                    currentAfd.getStartOffset(),
                    currentAfd.getLength()
            );
            mediaPlayer.setVolume(volume, volume);

            mediaPlayer.setOnPreparedListener(player -> {
                try {
                    player.start();
                } catch (Exception e) {
                    Log.e(TAG, "تعذر بدء تشغيل الأذان", e);
                    stopPlayback(true);
                }
            });

            mediaPlayer.setOnCompletionListener(player -> {
                Log.i(TAG, "انتهى تشغيل الأذان");
                stopPlayback(true);
            });

            mediaPlayer.setOnErrorListener((player, what, extra) -> {
                Log.e(TAG, "خطأ في مشغل الأذان: what=" + what + ", extra=" + extra);
                stopPlayback(true);
                return true;
            });

            mediaPlayer.prepareAsync();

        } catch (Exception e) {
            Log.e(TAG, "خطأ في تحميل ملف الأذان: " + fileName, e);
            stopPlayback(true);
        }
    }

    // ✅ إغلاق AFD بشكل آمن
    private void closeCurrentAfd() {
        if (currentAfd != null) {
            try {
                currentAfd.close();
            } catch (Exception ignored) {}
            currentAfd = null;
        }
    }

    private void requestAudioFocus() {
        try {
            if (audioManager == null) {
                audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            }
            if (audioManager == null) return;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                AudioAttributes attributes = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build();

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
            Log.i(TAG, "تم طلب AudioFocus");
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

    private void stopPlayback(boolean scheduleNext) {
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
            closeCurrentAfd(); // ✅ إغلاق AFD هنا بعد التوقف
            stopForegroundService();
            stopSelf();
            NotificationHelper.updatePersistent(this);

            if (scheduleNext) {
                AdhanScheduler.scheduleNextAdhan(this);
            }
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
        } else {
            startForeground(NotificationHelper.ID_PLAYING, notification);
        }
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
        if (screenReceiverRegistered) {
            try {
                unregisterReceiver(screenOffReceiver);
            } catch (Exception e) {
                Log.w(TAG, "تعذر إلغاء تسجيل مستقبل الشاشة", e);
            }
            screenReceiverRegistered = false;
        }

        abandonAudioFocus();
        closeCurrentAfd(); // ✅ إغلاق AFD قبل تحرير المشغل
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