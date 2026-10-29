package com.alhaddad.islami;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.session.DefaultMediaNotificationProvider;
import androidx.media3.session.MediaSession;
import androidx.media3.session.MediaSessionService;

@UnstableApi
public class QuranPlaybackService extends MediaSessionService {

    private static final String TAG = "QuranPlayback";
    public static final String CHANNEL_ID = "quran_playback";
    public static final int NOTIFICATION_ID = 830021;

    private ExoPlayer player;
    private MediaSession mediaSession;

    @Override
    public void onCreate() {
        super.onCreate();

        createPlaybackChannel();

        DefaultMediaNotificationProvider notificationProvider =
                new DefaultMediaNotificationProvider.Builder(this)
                        .setChannelId(CHANNEL_ID)
                        .setNotificationId(NOTIFICATION_ID)
                        .build();

        setMediaNotificationProvider(notificationProvider);

        AudioAttributes audioAttributes =
                new AudioAttributes.Builder()
                        .setUsage(C.USAGE_MEDIA)
                        .setContentType(C.AUDIO_CONTENT_TYPE_SPEECH)
                        .build();

        player =
                new ExoPlayer.Builder(this)
                        .setAudioAttributes(audioAttributes, true)
                        .setHandleAudioBecomingNoisy(true) // ✅ إيقاف الصوت إذا تم فصل السماعة
                        .setWakeMode(C.WAKE_MODE_LOCAL)
                        .build();

        // ✅ إضافة Callback لاستقبال أوامر أزرار الهاتف (السماعات / شاشة القفل)
        MediaSession.Callback sessionCallback = new MediaSession.Callback() {
            @Override
            public MediaSession.ConnectionResult onConnect(MediaSession session, MediaSession.ControllerInfo controller) {
                // نسمح للنظام (أزرار الهاتف) بإرسال أوامر التشغيل والإيقاف
                return new MediaSession.ConnectionResult.AcceptedResultBuilder(session)
                        .setAvailablePlayerCommands(
                                MediaSession.ConnectionResult.DEFAULT_PLAYER_COMMANDS.buildUpon()
                                        .add(Player.COMMAND_PLAY_PAUSE)
                                        .add(Player.COMMAND_SEEK_TO_NEXT)
                                        .add(Player.COMMAND_SEEK_TO_PREVIOUS)
                                        .build()
                        ).build();
            }
        };

        mediaSession =
                new MediaSession.Builder(this, player)
                        .setCallback(sessionCallback) // ✅ ربط الأزرار بالـ Player
                        .build();
    }

    private void createPlaybackChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null) return;

        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "تشغيل القرآن",
                NotificationManager.IMPORTANCE_LOW
        );

        channel.setDescription("إشعار تشغيل تلاوات القرآن في الخلفية");
        channel.setSound(null, null);
        channel.enableVibration(false);
        channel.setShowBadge(false);

        manager.createNotificationChannel(channel);
    }

    @Nullable
    @Override
    public MediaSession onGetSession(MediaSession.ControllerInfo controllerInfo) {
        return mediaSession;
    }

    @Override
    public void onTaskRemoved(@Nullable Intent rootIntent) {
        if (!isPlaybackOngoing()) {
            stopSelf();
        }
    }

    @Override
    public void onDestroy() {
        if (mediaSession != null) {
            mediaSession.release();
            mediaSession = null;
        }

        if (player != null) {
            player.release();
            player = null;
        }

        super.onDestroy();
    }
}