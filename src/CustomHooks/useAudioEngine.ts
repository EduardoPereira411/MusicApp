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

const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export function useAudioEngine() {
  const { navidromeCreds } = useAuth();
  const credsRef = useRef(navidromeCreds);
  useEffect(() => {
    credsRef.current = navidromeCreds;
  }, [navidromeCreds]);

  // Queue for items that are rendered on the UI
  const [queue, setQueue] = useState<QueueSong[]>([]);
  // Index on the queue for the currently playing Item
  const [playingSongQueueIndex, setPlayingSongQueueIndex] =
    useState<number>(-1);
  // Context for where the command to start the song was issued from
  const [playbackContext, setPlaybackContext] =
    useState<PlaybackContext | null>(null);

  // source of truth for queue info
  const internalQueueRef = useRef<{
    userQueue: QueueSong[];
    contextQueue: Song[];
    renderedQueue: QueueSong[];
    playingSongQueueIndex: number;
  }>({
    userQueue: [],
    contextQueue: [],
    renderedQueue: queue,
    playingSongQueueIndex: playingSongQueueIndex,
  });

  // AudioPlayerInfo
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);

  const [lookAheadError, setLookAheadError] = useState<boolean>(false);
  const { showToast } = useToast();

  // Set Metadata for currently playing song
  const currentSong = useMemo(() => {
    return playingSongQueueIndex >= 0 && playingSongQueueIndex < queue.length
      ? queue[playingSongQueueIndex]
      : null;
  }, [playingSongQueueIndex, queue]);

  const { url: currentArtworkUrl } = useArtwork(currentSong?.coverArt, 300);

  useEffect(() => {
    internalQueueRef.current.renderedQueue = queue;
    internalQueueRef.current.playingSongQueueIndex = playingSongQueueIndex;
  }, [queue, playingSongQueueIndex]);

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

  useEffect(() => {
    if (!currentSong) return;

    MediaControl.updateMetadata({
      title: currentSong.title,
      artist: currentSong.artist,
      album: currentSong.album || "Navidrome Album",
      artwork: currentArtworkUrl ? { uri: currentArtworkUrl } : undefined,
      duration: status.duration || currentSong.duration || 0,
    }).catch(() => {
      showToast(
        "Unable to synchronize music metadata layout with your OS control center.",
        "error",
      );
    });
  }, [currentSong, status.duration, currentArtworkUrl, showToast]);

  // LOOK-AHEAD AUTOMATION
  useEffect(() => {
    if (playingSongQueueIndex === -1 || queue.length === 0) return;

    const songsRemaining = queue.length - 1 - playingSongQueueIndex;

    if (songsRemaining <= 2) {
      const storage = internalQueueRef.current;
      const totalPoolLength =
        storage.contextQueue.length + storage.userQueue.length;

      if (totalPoolLength > queue.length) {
        const nextRawBatch = storage.contextQueue.slice(
          queue.length,
          queue.length + 5,
        );

        const decoratedBatch: QueueSong[] = nextRawBatch.map((track) => ({
          ...track,
          origin: "auto" as const,
          clientQueueId: generateUniqueId(),
        }));

        setQueue((prev) => [...prev, ...decoratedBatch]);
        setLookAheadError(false);
      }

      if (totalPoolLength <= queue.length) {
        const lastSong = queue[queue.length - 1];

        if (!credsRef.current) return;

        fetchThemeOrRandomQueue(credsRef.current!, lastSong, 5)
          .then((nextTracks) => {
            if (nextTracks.length > 0) {
              const flaggedTracks = nextTracks.map((track) => ({
                ...track,
                origin: "auto" as const,
                clientQueueId: generateUniqueId(),
              }));
              internalQueueRef.current.contextQueue.push(...flaggedTracks);
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
  }, [playingSongQueueIndex, queue.length, showToast, lookAheadError]);

  useEffect(() => {
    if (lookAheadError) {
      setLookAheadError(false);
    }
  }, [playingSongQueueIndex]);

  const loadSongAtIndex = useCallback(
    async (
      index: number,
      targetQueue = internalQueueRef.current.renderedQueue,
    ) => {
      if (index < 0 || index >= targetQueue.length || !credsRef.current) return;

      const targetSong = targetQueue[index];

      try {
        const url = getStreamUrl(credsRef.current!, targetSong.id);
        if (!url)
          throw new Error("Could not construct a valid stream endpoint URL.");

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

  // OS Native Media Control Listeners
  useEffect(() => {
    const removeListener = MediaControl.addListener((event) => {
      const { renderedQueue: freshQueue, playingSongQueueIndex: freshIndex } =
        internalQueueRef.current;

      switch (event.command) {
        case Command.PLAY:
          player.play();
          break;
        case Command.PAUSE:
          player.pause();
          break;
        case Command.NEXT_TRACK:
          if (freshIndex < freshQueue.length - 1) {
            loadSongAtIndex(freshIndex + 1, freshQueue);
          }
          break;
        case Command.PREVIOUS_TRACK:
          if (freshIndex > 0) {
            loadSongAtIndex(freshIndex - 1, freshQueue);
          }
          break;
        case Command.SEEK:
          if (event.data && typeof event.data.position === "number") {
            player.seekTo(event.data.position);
          } else if (typeof event.data === "number") {
            player.seekTo(event.data);
          }
          break;
        default:
          break;
      }
    });

    return () => removeListener();
  }, [player, loadSongAtIndex]);

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

        const currentActiveQueue = internalQueueRef.current.renderedQueue;
        const currentActiveIndex =
          internalQueueRef.current.playingSongQueueIndex;

        if (currentActiveQueue[currentActiveIndex]?.id === song.id) {
          if (player.playing) player.pause();
          else player.play();
          return;
        }

        const url = getStreamUrl(credsRef.current!, song.id);
        if (!url) {
          throw new Error("Failed to format media stream server url location.");
        }

        internalQueueRef.current.userQueue = [];
        setLookAheadError(false);

        if (contextSongs && contextSongs.length > 0) {
          const idx = contextSongs.findIndex((s) => s.id === song.id);
          const relativeContext =
            idx !== -1 ? contextSongs.slice(idx) : contextSongs;
          internalQueueRef.current.contextQueue = relativeContext;

          const initialChunk = relativeContext.slice(0, 5).map((s) => ({
            ...s,
            origin: "auto" as const,
            clientQueueId: generateUniqueId(),
            playbackContext: determinedContext,
          }));

          setQueue(initialChunk);
          setPlayingSongQueueIndex(0);
        } else {
          const userTracks: QueueSong[] = [
            {
              ...song,
              origin: "user" as const,
              clientQueueId: generateUniqueId(),
              playbackContext: determinedContext,
            },
          ];
          internalQueueRef.current.contextQueue = [];
          setQueue(userTracks);
          setPlayingSongQueueIndex(0);
        }

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
      const storage = internalQueueRef.current;
      const flaggedSong: QueueSong = {
        ...song,
        origin: "user",
        clientQueueId: generateUniqueId(),
      };

      storage.userQueue.push(flaggedSong);
      setLookAheadError(false);
      setQueue((prev) => {
        if (prev.length === 0) {
          setTimeout(() => {
            playSongNow(flaggedSong).catch((err) => {
              showToast(
                `Unable to start queue: ${err.message || err}`,
                "error",
              );
            });
          }, 0);
          return [flaggedSong];
        }

        const updated = [...prev];

        let insertionIndex = -1;
        for (let i = playingSongQueueIndex + 1; i < updated.length; i++) {
          if (updated[i].origin === "auto") {
            insertionIndex = i;
            break;
          }
        }

        if (insertionIndex === -1) {
          insertionIndex = updated.length;
        }

        updated.splice(insertionIndex, 0, flaggedSong);
        return updated;
      });

      showToast(`Added "${song.title}" to queue`);
    },
    [playingSongQueueIndex, playSongNow, showToast],
  );

  const playNext = useCallback(() => {
    const { renderedQueue: q, playingSongQueueIndex: idx } =
      internalQueueRef.current;
    if (idx < q.length - 1) {
      loadSongAtIndex(idx + 1, q);
    }
  }, [loadSongAtIndex]);

  const playPrevious = useCallback(() => {
    const { playingSongQueueIndex: idx, renderedQueue: q } =
      internalQueueRef.current;
    if (idx > 0) {
      loadSongAtIndex(idx - 1, q);
    }
  }, [loadSongAtIndex]);

  const togglePlayPause = useCallback(() => {
    if (player.playing) player.pause();
    else player.play();
  }, [player]);

  const seekTo = useCallback(
    (seconds: number) => {
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
        const storage = internalQueueRef.current;

        if (indexToRemove < storage.userQueue.length) {
          storage.userQueue.splice(indexToRemove, 1);
        } else {
          const adjustedContextIdx = indexToRemove - storage.userQueue.length;
          if (adjustedContextIdx < storage.contextQueue.length) {
            storage.contextQueue.splice(adjustedContextIdx, 1);
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
            setTimeout(() => loadSongAtIndex(nextIndex, updatedQueue), 0);
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
      const currentQueue = internalQueueRef.current.renderedQueue;
      if (index >= 0 && index < currentQueue.length) {
        loadSongAtIndex(index, currentQueue);
      }
    },
    [loadSongAtIndex],
  );

  const updateQueueOrder = useCallback(
    (newQueue: QueueSong[]) => {
      setQueue(newQueue);

      const upcoming = newQueue.slice(playingSongQueueIndex + 1);
      internalQueueRef.current.userQueue = upcoming.filter(
        (s) => s.origin === "user",
      );
      internalQueueRef.current.contextQueue = upcoming.filter(
        (s) => s.origin === "auto",
      );
    },
    [playingSongQueueIndex],
  );

  const logoutCleanUp = useCallback(() => {
    try {
      setQueue([]);
      setPlayingSongQueueIndex(-1);
      internalQueueRef.current = {
        userQueue: [],
        contextQueue: [],
        renderedQueue: [],
        playingSongQueueIndex: -1,
      };
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
    } catch (error: any) {
      showToast("Audio ecosystem cleanup failed during logout.", "error");
    }
  }, [player, showToast]);

  //listen for end of track event to skip to next song
  useEffect(() => {
    if (!player) return;
    const subscription = player.addListener(
      "playbackStatusUpdate",
      (statusUpdate) => {
        if (statusUpdate.didJustFinish) {
          const {
            renderedQueue: freshQueue,
            playingSongQueueIndex: freshIndex,
          } = internalQueueRef.current;

          if (freshIndex < freshQueue.length - 1) {
            loadSongAtIndex(freshIndex + 1, freshQueue);
          } else {
            setPlayingSongQueueIndex(-1);
            setQueue([]);
            internalQueueRef.current.userQueue = [];
            internalQueueRef.current.contextQueue = [];
          }
        }
      },
    );
    return () => {
      subscription.remove();
    };
  }, [player, loadSongAtIndex]);

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
