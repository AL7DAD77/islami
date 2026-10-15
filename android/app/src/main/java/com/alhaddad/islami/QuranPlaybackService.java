package com.alhaddad.islami;

import android.content.Intent;
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

    private ExoPlayer player;
    private MediaSession mediaSession;

    @Override
    public void onCreate() {
        super.onCreate();

        // قناة ومعرّف مستقلان عن إشعارات الأذان.
        DefaultMediaNotificationProvider notificationProvider =
                new DefaultMediaNotificationProvider.Builder(this)
                        .setChannelId("quran_playback")
                        .setNotificationId(830021)
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
                        .setHandleAudioBecomingNoisy(true)
                        .setWakeMode(C.WAKE_MODE_LOCAL)
                        .build();

        player.addListener(
                new Player.Listener() {
                    @Override
                    public void onPlayWhenReadyChanged(
                            boolean playWhenReady,
                            int reason
                    ) {
                        // لا يستأنف القرآن تلقائيًا بعد مقاطعة صوتية.
                        if (!playWhenReady
                                && reason
                                == Player.PLAY_WHEN_READY_CHANGE_REASON_AUDIO_FOCUS_LOSS) {
                            player.pause();
                        }
                    }

                    @Override
                    public void onPlayerError(PlaybackException error) {
                        Log.e(
                                TAG,
                                "Playback failed. Code: " + error.errorCode,
                                error
                        );
                    }
                }
        );

        mediaSession =
                new MediaSession.Builder(this, player)
                        .build();
    }

    @Nullable
    @Override
    public MediaSession onGetSession(
            MediaSession.ControllerInfo controllerInfo
    ) {
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