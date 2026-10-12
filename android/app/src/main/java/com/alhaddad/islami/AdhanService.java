package com.alhaddad.islami;

import android.app.Notification;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

import androidx.annotation.Nullable;
import androidx.core.app.ServiceCompat;

/**
 * خدمة أمامية (نوع mediaPlayback) تشغّل ملف الأذان من داخل التطبيق،
 * فيعمل الأذان كاملاً حتى لو كان التطبيق مغلقاً.
 */
public class AdhanService extends Service {
    static final String ACTION_STOP = "com.alhaddad.islami.ACTION_STOP_ADHAN";
    private static final String ASSET_DIR = "public/audio/adhans/";

    private MediaPlayer player;
    private AudioManager audioManager;
    private AudioFocusRequest focusRequest;
    private AudioAttributes attrs;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            finishPlayback();
            return START_NOT_STICKY;
        }

        String title = intent != null ? intent.getStringExtra("title") : null;
        String body = intent != null ? intent.getStringExtra("body") : null;
        String file = intent != null ? intent.getStringExtra("file") : null;
        float volume = intent != null ? intent.getFloatExtra("volume", 0.9f) : 0.9f;
        if (title == null) title = "حان وقت الأذان";
        if (body == null) body = "";

        // يجب استدعاؤها فوراً بعد startForegroundService
        Notification n = NotificationHelper.buildPlaying(this, title, body);
        try {
            ServiceCompat.startForeground(
                    this,
                    NotificationHelper.ID_PLAYING,
                    n,
                    Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
                            ? ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
                            : 0);
        } catch (Exception e) {
            stopSelf();
            return START_NOT_STICKY;
        }

        play(file, Math.max(0f, Math.min(1f, volume)));
        return START_NOT_STICKY;
    }

    private void play(String file, float volume) {
        releasePlayer();
        attrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build();
        requestFocus();

        MediaPlayer mp = new MediaPlayer();
        try {
            mp.setAudioAttributes(attrs);
            mp.setWakeMode(getApplicationContext(), PowerManager.PARTIAL_WAKE_LOCK);

            boolean set = false;
            if (file != null && !file.isEmpty()) {
                try {
                    AssetFileDescriptor afd = getAssets().openFd(ASSET_DIR + file);
                    mp.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
                    afd.close();
                    set = true;
                } catch (Exception ignored) {
                    // الملف غير موجود داخل التطبيق: نستخدم صوت تنبيه النظام بدلاً من الصمت
                }
            }
            if (!set) {
                Uri fallback = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                if (fallback == null) fallback = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                mp.setDataSource(getApplicationContext(), fallback);
            }

            mp.setVolume(volume, volume);
            mp.setOnCompletionListener(m -> finishPlayback());
            mp.setOnErrorListener((m, what, extra) -> {
                finishPlayback();
                return true;
            });
            mp.prepare();
            mp.start();
            player = mp;
        } catch (Exception e) {
            try {
                mp.release();
            } catch (Exception ignored) {
            }
            finishPlayback();
        }
    }

    private void requestFocus() {
        audioManager = (AudioManager) getSystemService(AUDIO_SERVICE);
        if (audioManager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                    .setAudioAttributes(attrs)
                    .build();
            audioManager.requestAudioFocus(focusRequest);
        } else {
            audioManager.requestAudioFocus(null, AudioManager.STREAM_ALARM, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT);
        }
    }

    private void abandonFocus() {
        if (audioManager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (focusRequest != null) audioManager.abandonAudioFocusRequest(focusRequest);
        } else {
            audioManager.abandonAudioFocus(null);
        }
    }

    private void releasePlayer() {
        if (player != null) {
            try {
                if (player.isPlaying()) player.stop();
            } catch (Exception ignored) {
            }
            try {
                player.release();
            } catch (Exception ignored) {
            }
            player = null;
        }
    }

    private void finishPlayback() {
        releasePlayer();
        abandonFocus();
        stopForeground(STOP_FOREGROUND_REMOVE);
        stopSelf();
        // بعد انتهاء الأذان يُحدَّث الإشعار الدائم إلى الصلاة التالية
        NotificationHelper.updatePersistent(getApplicationContext());
    }

    @Override
    public void onDestroy() {
        releasePlayer();
        abandonFocus();
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
