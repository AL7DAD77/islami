package com.alhaddad.islami;

import android.content.ComponentName;
import android.net.Uri;
import android.os.Bundle;

import androidx.core.content.ContextCompat;
import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MediaMetadata;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.session.MediaController;
import androidx.media3.session.SessionToken;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.common.util.concurrent.ListenableFuture;

@UnstableApi
@CapacitorPlugin(name = "QuranPlayer")
public class QuranPlayerPlugin extends Plugin {

    private ListenableFuture<MediaController> controllerFuture;
    private boolean destroyed = false;

    private interface ControllerAction {
        void run(MediaController controller) throws Exception;
    }

    private void withController(
            PluginCall call,
            ControllerAction action
    ) {
        ContextCompat.getMainExecutor(getContext()).execute(() -> {
            if (destroyed) {
                call.reject("Quran player plugin is closed");
                return;
            }

            try {
                if (controllerFuture != null && controllerFuture.isDone()) {
                    try {
                        MediaController previous = controllerFuture.get();

                        if (!previous.isConnected()) {
                            MediaController.releaseFuture(controllerFuture);
                            controllerFuture = null;
                        }
                    } catch (Exception ignored) {
                        MediaController.releaseFuture(controllerFuture);
                        controllerFuture = null;
                    }
                }

                if (controllerFuture == null) {
                    SessionToken token =
                            new SessionToken(
                                    getContext(),
                                    new ComponentName(
                                            getContext(),
                                            QuranPlaybackService.class
                                    )
                            );

                    controllerFuture =
                            new MediaController.Builder(getContext(), token)
                                    .buildAsync();
                }

                ListenableFuture<MediaController> future = controllerFuture;

                future.addListener(
                        () -> {
                            if (destroyed) {
                                call.reject("Quran player plugin is closed");
                                return;
                            }

                            try {
                                MediaController controller = future.get();

                                if (!controller.isConnected()) {
                                    call.reject("Quran playback service is disconnected");
                                    return;
                                }

                                action.run(controller);
                            } catch (Exception error) {
                                call.reject(
                                        "Quran player: " + error.getMessage(),
                                        error
                                );
                            }
                        },
                        ContextCompat.getMainExecutor(getContext())
                );
            } catch (Exception error) {
                call.reject(
                        "Cannot connect to Quran playback service: "
                                + error.getMessage(),
                        error
                );
            }
        });
    }

    @PluginMethod
    public void play(PluginCall call) {
        String url = call.getString("url");
        String title = call.getString("title", "القرآن الكريم");
        String artist = call.getString("artist", "");
        String ui = call.getString("ui", "");
        boolean repeat = Boolean.TRUE.equals(call.getBoolean("repeat", false));

        if (url == null || url.trim().isEmpty()) {
            call.reject("Audio URL is missing");
            return;
        }

        Uri uri = Uri.parse(url);
        String scheme = uri.getScheme();

        if (!"https".equalsIgnoreCase(scheme)
                && !"http".equalsIgnoreCase(scheme)) {
            call.reject("Only HTTP or HTTPS audio URLs are supported");
            return;
        }

        withController(call, controller -> {
            Bundle extras = new Bundle();
            extras.putString("quran_ui", ui);

            MediaMetadata metadata =
                    new MediaMetadata.Builder()
                            .setTitle(title)
                            .setArtist(artist)
                            .setAlbumTitle("القرآن الكريم")
                            .setExtras(extras)
                            .build();

            MediaItem item =
                    new MediaItem.Builder()
                            .setMediaId(url)
                            .setUri(uri)
                            .setMediaMetadata(metadata)
                            .build();

            MediaItem current = controller.getCurrentMediaItem();

            controller.setRepeatMode(
                    repeat
                            ? Player.REPEAT_MODE_ONE
                            : Player.REPEAT_MODE_OFF
            );

            if (current == null || !url.equals(current.mediaId)) {
                controller.setMediaItem(item);
                controller.prepare();
            } else if (controller.getPlaybackState() == Player.STATE_ENDED) {
                controller.seekTo(0);
            }

            if (controller.getPlaybackState() == Player.STATE_IDLE
                    || controller.getPlayerError() != null) {
                controller.prepare();
            }

            controller.play();
            call.resolve(snapshot(controller));
        });
    }

    @PluginMethod
    public void toggle(PluginCall call) {
        withController(call, controller -> {
            if (controller.getCurrentMediaItem() == null) {
                call.resolve(snapshot(controller));
                return;
            }

            if (controller.getPlayWhenReady()) {
                controller.pause();
            } else {
                if (controller.getPlaybackState() == Player.STATE_ENDED) {
                    controller.seekTo(0);
                }

                if (controller.getPlaybackState() == Player.STATE_IDLE
                        || controller.getPlayerError() != null) {
                    controller.prepare();
                }

                controller.play();
            }

            call.resolve(snapshot(controller));
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        withController(call, controller -> {
            controller.pause();

            if (controller.getCurrentMediaItem() != null) {
                controller.seekTo(0);
            }

            call.resolve(snapshot(controller));
        });
    }

    @PluginMethod
    public void setRepeat(PluginCall call) {
        boolean enabled =
                Boolean.TRUE.equals(call.getBoolean("enabled", false));

        withController(call, controller -> {
            controller.setRepeatMode(
                    enabled
                            ? Player.REPEAT_MODE_ONE
                            : Player.REPEAT_MODE_OFF
            );

            call.resolve(snapshot(controller));
        });
    }

    @PluginMethod
    public void getState(PluginCall call) {
        withController(call, controller ->
                call.resolve(snapshot(controller))
        );
    }

    private JSObject snapshot(MediaController controller) {
        JSObject result = new JSObject();

        long duration = controller.getDuration();
        long position = Math.max(0, controller.getCurrentPosition());

        boolean validDuration =
                duration != C.TIME_UNSET && duration > 0;

        boolean ended =
                controller.getPlaybackState() == Player.STATE_ENDED;

        double progress =
                validDuration
                        ? Math.min(100.0, position * 100.0 / duration)
                        : 0.0;

        result.put("playing", controller.isPlaying());
        result.put(
                "loading",
                controller.getPlayWhenReady()
                        && controller.getPlaybackState() == Player.STATE_BUFFERING
        );
        result.put("progress", ended ? 0.0 : progress);
        result.put(
                "repeat",
                controller.getRepeatMode() == Player.REPEAT_MODE_ONE
        );

        MediaItem current = controller.getCurrentMediaItem();

        result.put("url", current == null ? "" : current.mediaId);

        String ui = "";

        if (current != null && current.mediaMetadata.extras != null) {
            ui = current.mediaMetadata.extras.getString("quran_ui", "");
        }

        result.put("ui", ui);

        PlaybackException error = controller.getPlayerError();

        result.put(
                "error",
                error == null
                        ? ""
                        : "Code " + error.errorCode + ": " + error.getMessage()
        );

        return result;
    }

    @Override
    protected void handleOnDestroy() {
        ContextCompat.getMainExecutor(getContext()).execute(() -> {
            destroyed = true;

            if (controllerFuture != null) {
                MediaController.releaseFuture(controllerFuture);
                controllerFuture = null;
            }
        });

        super.handleOnDestroy();
    }
}