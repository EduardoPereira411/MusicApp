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
import { Song, QueueSong } from "@/Models/Models";
import { useToast } from "@/Context/ToastContext";
import { useAuth } from "@/Context/AuthContext";
import { useArtwork } from "./useArtwork";

const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export function useAudioEngine() {
  const { navidromeCreds } = useAuth();
  const [queue, setQueue] = useState<QueueSong[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  const [lookAheadError, setLookAheadError] = useState<boolean>(false);

  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  const { showToast } = useToast();

  const internalQueueRef = useRef<{
    userQueue: QueueSong[];
    contextQueue: Song[];
  }>({
    userQueue: [],
    contextQueue: [],
  });

  const credsRef = useRef(navidromeCreds);
  useEffect(() => {
    credsRef.current = navidromeCreds;
  }, [navidromeCreds]);

  const currentSong = useMemo(() => {
    return currentIndex >= 0 && currentIndex < queue.length
      ? queue[currentIndex]
      : null;
  }, [currentIndex, queue]);

  const { url: currentArtworkUrl } = useArtwork(currentSong?.coverArt, 500);

  const stateRef = useRef<{ queue: QueueSong[]; currentIndex: number }>({
    queue,
    currentIndex,
  });
  useEffect(() => {
    stateRef.current = { queue, currentIndex };
  }, [queue, currentIndex]);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "doNotMix",
      shouldPlayInBackground: true,
    }).catch((err) => console.error("Error setting audio mode:", err));

    MediaControl.enableMediaControls({
      capabilities: [
        Command.PLAY,
        Command.PAUSE,
        Command.NEXT_TRACK,
        Command.PREVIOUS_TRACK,
        Command.SEEK,
      ],
      compactCapabilities: [Command.PLAY, Command.PAUSE, Command.NEXT_TRACK],
    }).catch((err) => console.error("Error setting media keys:", err));

    return () => {
      MediaControl.disableMediaControls().catch((err) =>
        console.error("Error disabling media controls on teardown:", err),
      );
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
    }).catch((err) => console.error("Error updating metadata:", err));
  }, [currentSong, status.duration, currentArtworkUrl]);

  // LOOK-AHEAD AUTOMATION
  useEffect(() => {
    if (currentIndex === -1 || queue.length === 0) return;

    const songsRemaining = queue.length - 1 - currentIndex;

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
          .catch((error: any) => {
            showToast("Failed to fetch next automatic radio tracks", "error");
            setLookAheadError(true);
          });
      }
    }
  }, [currentIndex, queue.length, showToast, lookAheadError]);

  useEffect(() => {
    if (lookAheadError) {
      setLookAheadError(false);
    }
  }, [currentIndex]);

  const loadSongAtIndex = useCallback(
    async (index: number, targetQueue = stateRef.current.queue) => {
      if (index < 0 || index >= targetQueue.length || !credsRef.current) return;

      const targetSong = targetQueue[index];

      try {
        const url = getStreamUrl(credsRef.current!, targetSong.id);
        if (!url)
          throw new Error("Could not construct a valid stream endpoint URL.");

        setCurrentIndex(index);
        setLookAheadError(false);
        player.replace({ uri: url });
        player.play();
      } catch (err: any) {
        showToast(`Playback Failed: ${err.message || err}`, "error");
      }
    },
    [player, showToast],
  );

  useEffect(() => {
    const removeListener = MediaControl.addListener((event) => {
      const { queue: freshQueue, currentIndex: freshIndex } = stateRef.current;

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
      ).catch((e) => console.error("Lockscreen state sync failed:", e));
    }
  }, [status.playing, currentSong]);

  const playSongNow = useCallback(
    async (song: Song, contextSongs?: Song[]) => {
      if (!credsRef.current) {
        showToast("Missing active player credentials.", "error");
        throw new Error("Missing active player authentication config.");
      }

      try {
        if (
          stateRef.current.queue[stateRef.current.currentIndex]?.id === song.id
        ) {
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
          }));

          setQueue(initialChunk);
          setCurrentIndex(0);
        } else {
          const userTracks: QueueSong[] = [
            {
              ...song,
              origin: "user" as const,
              clientQueueId: generateUniqueId(),
            },
          ];
          internalQueueRef.current.contextQueue = [];
          setQueue(userTracks);
          setCurrentIndex(0);
        }

        player.replace({ uri: url });
        player.play();
      } catch (err: any) {
        showToast(
          `Streaming initialization failed: ${err.message || err}`,
          "error",
        );
        throw err;
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
              showToast(`Unable to start queue: ${err.message || err}`);
            });
          }, 0);
          return [flaggedSong];
        }

        const updated = [...prev];

        let insertionIndex = -1;
        for (let i = currentIndex + 1; i < updated.length; i++) {
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
    [currentIndex, playSongNow, showToast],
  );

  const playNext = useCallback(() => {
    const { queue: q, currentIndex: idx } = stateRef.current;
    if (idx < q.length - 1) {
      loadSongAtIndex(idx + 1, q);
    }
  }, [loadSongAtIndex]);

  const playPrevious = useCallback(() => {
    const { currentIndex: idx, queue: q } = stateRef.current;
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
          (e) => console.error("Lockscreen state sync failed on seek:", e),
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

        if (currentIndex === indexToRemove) {
          if (updatedQueue.length === 0) {
            setCurrentIndex(-1);
            player.pause();
          } else {
            const nextIndex =
              indexToRemove >= updatedQueue.length
                ? updatedQueue.length - 1
                : indexToRemove;
            setTimeout(() => loadSongAtIndex(nextIndex, updatedQueue), 0);
          }
        } else if (currentIndex > indexToRemove) {
          setCurrentIndex((prev) => prev - 1);
        }
        return updatedQueue;
      });
    },
    [currentIndex, loadSongAtIndex, player],
  );

  const skipToQueueIndex = useCallback(
    (index: number) => {
      const { queue: currentQueue } = stateRef.current;
      if (index >= 0 && index < currentQueue.length) {
        loadSongAtIndex(index, currentQueue);
      }
    },
    [loadSongAtIndex],
  );

  const updateQueueOrder = useCallback(
    (newQueue: QueueSong[]) => {
      setQueue(newQueue);

      const upcoming = newQueue.slice(currentIndex + 1);
      internalQueueRef.current.userQueue = upcoming.filter(
        (s) => s.origin === "user",
      );
      internalQueueRef.current.contextQueue = upcoming.filter(
        (s) => s.origin === "auto",
      );
    },
    [currentIndex],
  );

  const logoutCleanUp = useCallback(() => {
    try {
      setQueue([]);
      setCurrentIndex(-1);
      internalQueueRef.current = { userQueue: [], contextQueue: [] };
      player.replace("");
      player.pause();
      MediaControl.updateMetadata({
        title: "",
        artist: "",
        album: "",
        artwork: undefined,
        duration: 0,
      }).catch((err) => console.error("Error clearing metadata:", err));

      MediaControl.updatePlaybackState(PlaybackState.PAUSED, 0, 0.0).catch(
        (e) => console.error("Error resetting OS playback state:", e),
      );
    } catch (error) {
      console.error("Error executing layout audio teardown:", error);
    }
  }, [player]);

  useEffect(() => {
    if (
      currentSong &&
      !status.playing &&
      status.currentTime > 0 &&
      status.currentTime >= (status.duration || 1)
    ) {
      const { queue: freshQueue, currentIndex: freshIndex } = stateRef.current;
      if (freshIndex < freshQueue.length - 1) {
        loadSongAtIndex(freshIndex + 1, freshQueue);
      } else {
        setCurrentIndex(-1);
        setQueue([]);
        internalQueueRef.current = { userQueue: [], contextQueue: [] };
      }
    }
  }, [
    status.playing,
    status.currentTime,
    status.duration,
    currentSong,
    loadSongAtIndex,
  ]);

  return {
    currentSong,
    queue,
    currentIndex,
    playing: status.playing,
    player,
    playSongNow,
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
