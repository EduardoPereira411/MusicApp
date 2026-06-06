import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";
import MediaControl, { Command, PlaybackState } from "expo-media-control";
import {
  getStreamUrl,
  fetchThemeOrRandomQueue,
} from "@/Services/navidromeService";
import { Song, QueueSong, PlaybackContext } from "@/Models/Models";
import { useToast } from "@/Context/ToastContext";
import { useAuth } from "@/Context/AuthContext";
import { useArtwork } from "./useArtwork";

const generateUniqueId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

export function useAudioEngine() {
  const { navidromeCreds } = useAuth();
  const credsRef = useRef(navidromeCreds);
  useEffect(() => {
    credsRef.current = navidromeCreds;
  }, [navidromeCreds]);

  // Source of truth for UI Layout
  const [queue, setQueue] = useState<QueueSong[]>([]);
  const [playingSongQueueIndex, setPlayingSongQueueIndex] =
    useState<number>(-1);
  const [playbackContext, setPlaybackContext] =
    useState<PlaybackContext | null>(null);
  const [lookAheadError, setLookAheadError] = useState<boolean>(false);

  // Ref for info that matters to the UI
  const stateRef = useRef({ queue, playingSongQueueIndex });
  useEffect(() => {
    stateRef.current = { queue, playingSongQueueIndex };
  }, [queue, playingSongQueueIndex]);

  // Ref for queue tracks that does not matter to the UI
  const poolsRef = useRef<{ userQueue: QueueSong[]; contextQueue: Song[] }>({
    userQueue: [],
    contextQueue: [],
  });

  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  const { showToast } = useToast();

  const currentSong = useMemo(() => {
    return playingSongQueueIndex >= 0 && playingSongQueueIndex < queue.length
      ? queue[playingSongQueueIndex]
      : null;
  }, [playingSongQueueIndex, queue]);

  const { url: currentArtworkUrl } = useArtwork(currentSong?.coverArt, 300);

  // Initialize Audio & Media Controls
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "doNotMix",
      shouldPlayInBackground: true,
    }).catch(() => {});
    MediaControl.enableMediaControls({
      capabilities: [
        Command.PLAY,
        Command.PAUSE,
        Command.NEXT_TRACK,
        Command.PREVIOUS_TRACK,
        Command.SEEK,
      ],
      compactCapabilities: [Command.PLAY, Command.PAUSE, Command.NEXT_TRACK],
    }).catch(() => {});
    return () => {
      MediaControl.disableMediaControls().catch(() => {});
    };
  }, []);

  // Update OS System Tray Metadata
  useEffect(() => {
    if (!currentSong) return;
    MediaControl.updateMetadata({
      title: currentSong.title,
      artist: currentSong.artist,
      album: currentSong.album || "Navidrome Album",
      artwork: currentArtworkUrl ? { uri: currentArtworkUrl } : undefined,
      duration: status.duration || currentSong.duration || 0,
    }).catch(() => {});
  }, [currentSong, status.duration, currentArtworkUrl]);

  // Update OS System Tray Playback Play/Pause state
  useEffect(() => {
    if (currentSong) {
      const stateValue = status.playing
        ? PlaybackState.PLAYING
        : PlaybackState.PAUSED;
      const speedRate = status.playing ? 1.0 : 0.0;

      MediaControl.updatePlaybackState(
        stateValue,
        status.currentTime,
        speedRate,
      ).catch(() => {});
    }
  }, [status.playing, currentSong]);

  // Look-Ahead Automation Execution
  useEffect(() => {
    if (playingSongQueueIndex === -1 || queue.length === 0) return;
    const songsRemaining = queue.length - 1 - playingSongQueueIndex;

    if (songsRemaining <= 2) {
      const totalPoolLength =
        poolsRef.current.contextQueue.length +
        poolsRef.current.userQueue.length;

      if (totalPoolLength > queue.length) {
        const nextRawBatch = poolsRef.current.contextQueue.slice(
          queue.length,
          queue.length + 5,
        );
        const decoratedBatch = nextRawBatch.map((track) => ({
          ...track,
          origin: "auto" as const,
          clientQueueId: generateUniqueId(),
        }));
        setQueue((prev) => [...prev, ...decoratedBatch]);
        setLookAheadError(false);
      } else {
        const lastSong = queue[queue.length - 1];
        if (!credsRef.current) return;

        fetchThemeOrRandomQueue(credsRef.current, lastSong, 5)
          .then((nextTracks) => {
            if (nextTracks.length > 0) {
              const flaggedTracks = nextTracks.map((track) => ({
                ...track,
                origin: "auto" as const,
                clientQueueId: generateUniqueId(),
              }));
              poolsRef.current.contextQueue.push(...flaggedTracks);
              setQueue((prev) => [...prev, ...flaggedTracks]);
              setLookAheadError(false);
            }
          })
          .catch(() => {
            showToast("Failed to fetch next automatic radio tracks", "error");
            setLookAheadError(true);
          });
      }
    }
  }, [playingSongQueueIndex, queue.length, lookAheadError, showToast]);

  useEffect(() => {
    if (lookAheadError) setLookAheadError(false);
  }, [playingSongQueueIndex]);

  const loadSongAtIndex = useCallback(
    async (index: number, targetQueue: QueueSong[]) => {
      if (index < 0 || index >= targetQueue.length || !credsRef.current) return;
      const targetSong = targetQueue[index];
      try {
        const url = getStreamUrl(credsRef.current, targetSong.id);
        if (!url) throw new Error("Endpoint construction failed.");
        setPlayingSongQueueIndex(index);
        setLookAheadError(false);
        player.replace({ uri: url });
        player.play();
      } catch (err: any) {
        showToast(`Playback Failed: ${err.message || err}`, "error");
      }
    },
    [player, showToast],
  );

  // Native Listeners pulling live, atomic data from stateRef
  useEffect(() => {
    const removeListener = MediaControl.addListener((event) => {
      const { queue: freshQueue, playingSongQueueIndex: freshIndex } =
        stateRef.current;
      switch (event.command) {
        case Command.PLAY:
          player.play();
          break;
        case Command.PAUSE:
          player.pause();
          break;
        case Command.NEXT_TRACK:
          if (freshIndex < freshQueue.length - 1)
            loadSongAtIndex(freshIndex + 1, freshQueue);
          break;
        case Command.PREVIOUS_TRACK:
          if (freshIndex > 0) loadSongAtIndex(freshIndex - 1, freshQueue);
          break;
        case Command.SEEK:
          const pos =
            event.data && typeof event.data.position === "number"
              ? event.data.position
              : event.data;
          if (typeof pos === "number") player.seekTo(pos);
          break;
      }
    });
    return () => removeListener();
  }, [player, loadSongAtIndex]);

  const playSongNow = useCallback(
    async (
      song: Song,
      contextSongs?: Song[],
      contextInfo?: PlaybackContext,
    ) => {
      if (!credsRef.current) return;
      try {
        const determinedContext = contextInfo || { type: "search" };
        setPlaybackContext(determinedContext);

        const {
          queue: currentActiveQueue,
          playingSongQueueIndex: currentActiveIndex,
        } = stateRef.current;
        if (currentActiveQueue[currentActiveIndex]?.id === song.id) {
          player.playing ? player.pause() : player.play();
          return;
        }

        const url = getStreamUrl(credsRef.current, song.id);
        if (!url) throw new Error("Failed to format media stream URL.");

        poolsRef.current.userQueue = [];
        setLookAheadError(false);

        //Load Context Songs into queue
        if (contextSongs && contextSongs.length > 0) {
          const idx = contextSongs.findIndex((s) => s.id === song.id);
          const relativeContext =
            idx !== -1 ? contextSongs.slice(idx) : contextSongs;
          poolsRef.current.contextQueue = relativeContext;

          const initialChunk = relativeContext.slice(0, 5).map((s) => ({
            ...s,
            origin: "auto" as const,
            clientQueueId: generateUniqueId(),
            playbackContext: determinedContext,
          }));
          setQueue(initialChunk);
        } else {
          const userTracks: QueueSong[] = [
            {
              ...song,
              origin: "user" as const,
              clientQueueId: generateUniqueId(),
              playbackContext: determinedContext,
            },
          ];
          poolsRef.current.contextQueue = [];
          setQueue(userTracks);
        }
        setPlayingSongQueueIndex(0);
        player.replace({ uri: url });
        player.play();
      } catch (err: any) {
        showToast(
          `Streaming initialization failed: ${err.message || err}`,
          "error",
        );
      }
    },
    [player, showToast],
  );

  const addToQueue = useCallback(
    (song: Song) => {
      const flaggedSong: QueueSong = {
        ...song,
        origin: "user",
        clientQueueId: generateUniqueId(),
      };
      poolsRef.current.userQueue.push(flaggedSong);
      setLookAheadError(false);

      setQueue((prev) => {
        if (prev.length === 0) {
          setTimeout(() => {
            playSongNow(flaggedSong).catch(() => {});
          }, 0);
          return [flaggedSong];
        }
        const updated = [...prev];
        let insertionIndex = updated.findIndex(
          (track, i) => i > playingSongQueueIndex && track.origin === "auto",
        );
        if (insertionIndex === -1) insertionIndex = updated.length;
        updated.splice(insertionIndex, 0, flaggedSong);
        return updated;
      });
      showToast(`Added "${song.title}" to queue`);
    },
    [playingSongQueueIndex, playSongNow, showToast],
  );

  const playNext = useCallback(() => {
    const { queue: q, playingSongQueueIndex: idx } = stateRef.current;
    if (idx < q.length - 1) loadSongAtIndex(idx + 1, q);
  }, [loadSongAtIndex]);

  const playPrevious = useCallback(() => {
    const { queue: q, playingSongQueueIndex: idx } = stateRef.current;
    if (idx > 0) loadSongAtIndex(idx - 1, q);
  }, [loadSongAtIndex]);

  const togglePlayPause = useCallback(() => {
    player.playing ? player.pause() : player.play();
  }, [player]);
  const seekTo = useCallback(
    (seconds: number) => {
      console.log("here");
      player?.seekTo(seconds);

      if (currentSong) {
        const stateValue = status.playing
          ? PlaybackState.PLAYING
          : PlaybackState.PAUSED;
        const speedRate = status.playing ? 1.0 : 0.0;
        MediaControl.updatePlaybackState(stateValue, seconds, speedRate).catch(
          () => {},
        );
      }
    },
    [player, currentSong, status.playing],
  );

  const removeFromQueue = useCallback(
    (indexToRemove: number) => {
      setQueue((prevQueue) => {
        if (indexToRemove < 0 || indexToRemove >= prevQueue.length)
          return prevQueue;
        const updatedQueue = prevQueue.filter(
          (_, idx) => idx !== indexToRemove,
        );

        if (indexToRemove < poolsRef.current.userQueue.length) {
          poolsRef.current.userQueue.splice(indexToRemove, 1);
        } else {
          const adjustedContextIdx =
            indexToRemove - poolsRef.current.userQueue.length;
          if (adjustedContextIdx < poolsRef.current.contextQueue.length) {
            poolsRef.current.contextQueue.splice(adjustedContextIdx, 1);
          }
        }

        if (playingSongQueueIndex === indexToRemove) {
          if (updatedQueue.length === 0) {
            setPlayingSongQueueIndex(-1);
            player.pause();
          } else {
            const nextIndex =
              indexToRemove >= updatedQueue.length
                ? updatedQueue.length - 1
                : indexToRemove;
            loadSongAtIndex(nextIndex, updatedQueue);
          }
        } else if (playingSongQueueIndex > indexToRemove) {
          setPlayingSongQueueIndex((prev) => prev - 1);
        }
        return updatedQueue;
      });
    },
    [playingSongQueueIndex, loadSongAtIndex, player],
  );

  const skipToQueueIndex = useCallback(
    (index: number) => {
      const currentQueue = stateRef.current.queue;
      if (index >= 0 && index < currentQueue.length)
        loadSongAtIndex(index, currentQueue);
    },
    [loadSongAtIndex],
  );

  const updateQueueOrder = useCallback(
    (newQueue: QueueSong[]) => {
      setQueue(newQueue);
      const upcoming = newQueue.slice(playingSongQueueIndex + 1);
      poolsRef.current.userQueue = upcoming.filter((s) => s.origin === "user");
      poolsRef.current.contextQueue = upcoming.filter(
        (s) => s.origin === "auto",
      );
    },
    [playingSongQueueIndex],
  );

  const logoutCleanUp = useCallback(() => {
    setQueue([]);
    setPlayingSongQueueIndex(-1);
    poolsRef.current = { userQueue: [], contextQueue: [] };
    player.replace("");
    player.pause();
    MediaControl.updateMetadata({
      title: "",
      artist: "",
      album: "",
      artwork: undefined,
      duration: 0,
    }).catch(() => {});
    MediaControl.updatePlaybackState(PlaybackState.PAUSED, 0, 0.0).catch(
      () => {},
    );
  }, [player]);

  // Handle track ending automation smoothly via up-to-date ref values
  const onTrackEndRef = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    onTrackEndRef.current = () => {
      const { queue: freshQueue, playingSongQueueIndex: freshIndex } =
        stateRef.current;

      if (freshIndex < freshQueue.length - 1) {
        loadSongAtIndex(freshIndex + 1, freshQueue);
      } else {
        setPlayingSongQueueIndex(-1);
        setQueue([]);
        poolsRef.current.userQueue = [];
        poolsRef.current.contextQueue = [];
      }
    };
  }, [loadSongAtIndex]);
  useEffect(() => {
    if (!player) return;
    const subscription = player.addListener(
      "playbackStatusUpdate",
      (statusUpdate) => {
        if (statusUpdate.didJustFinish) {
          const { queue: freshQueue, playingSongQueueIndex: freshIndex } =
            stateRef.current;
          if (freshIndex < freshQueue.length - 1) {
            loadSongAtIndex(freshIndex + 1, freshQueue);
          } else {
            setPlayingSongQueueIndex(-1);
            setQueue([]);
            poolsRef.current.userQueue = [];
            poolsRef.current.contextQueue = [];
          }
        }
      },
    );
    return () => subscription.remove();
  }, [player]);

  return {
    currentSong,
    queue,
    playingSongQueueIndex,
    playing: status.playing,
    player,
    playSongNow,
    playbackContext,
    addToQueue,
    playNext,
    playPrevious,
    togglePlayPause,
    seekTo,
    removeFromQueue,
    skipToQueueIndex,
    updateQueueOrder,
    logoutCleanUp,
  };
}
