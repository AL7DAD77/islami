package com.alhaddad.islami;

import android.content.Intent;

import androidx.annotation.Nullable;
import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.Player;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.session.MediaSession;
import androidx.media3.session.MediaSessionService;

/**
 * خدمة مستقلة لتشغيل القرآن.
 *
 * لا تغيّر جدولة الأذان أو إعداداته.
 * سيُضاف ربطها بواجهة التطبيق في المرحلة التالية.
 */
@UnstableApi
public class QuranPlaybackService extends MediaSessionService {

    private ExoPlayer player;
    private MediaSession mediaSession;

    @Override
    public void onCreate() {
        super.onCreate();

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

        /*
         * عند فقدان التركيز الصوتي لا نسمح للمشغّل
         * بالاستئناف تلقائياً بعد انتهاء المقاطعة.
         * سنضيف أيضاً ربطاً صريحاً مع بدء الأذان لاحقاً.
         */
        player.addListener(
                new Player.Listener() {
                    @Override
                    public void onPlayWhenReadyChanged(
                            boolean playWhenReady,
                            int reason
                    ) {
                        if (!playWhenReady
                                && reason
                                == Player.PLAY_WHEN_READY_CHANGE_REASON_AUDIO_FOCUS_LOSS) {
                            player.pause();
                        }
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
        /*
         * إزالة الواجهة من التطبيقات الأخيرة لا توقف
         * الخدمة ما دام هناك تشغيل جارٍ.
         */
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