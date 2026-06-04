// hooks/useAudioEngine.ts
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
import { Song } from "@/Models/Models";
import { useToast } from "@/Context/ToastContext";

export function useAudioEngine() {
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  const { showToast } = useToast();

  const internalQueueRef = useRef<{
    userQueue: Song[];
    contextQueue: Song[];
  }>({
    userQueue: [],
    contextQueue: [],
  });

  const currentSong = useMemo(() => {
    return currentIndex >= 0 && currentIndex < queue.length
      ? queue[currentIndex]
      : null;
  }, [currentIndex, queue]);

  const stateRef = useRef({ queue, currentIndex });
  useEffect(() => {
    stateRef.current = { queue, currentIndex };
  }, [queue, currentIndex]);

  // Initialization of OS background audio with track skipping functionality
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "doNotMix",
      shouldPlayInBackground: true,
    }).catch((err) => console.error("Error setting audio mode:", err));

    //Register Media controls only once
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
      // Disable controls when unmounted
      MediaControl.disableMediaControls().catch((err) =>
        console.error("Error disabling media controls on teardown:", err),
      );
    };
  }, []);

  //Updating art and duration of song
  useEffect(() => {
    if (!currentSong) return;

    MediaControl.updateMetadata({
      title: currentSong.title,
      artist: currentSong.artist,
      album: currentSong.album || "Navidrome Album",
      artwork: currentSong.artworkUrl
        ? { uri: currentSong.artworkUrl }
        : undefined,
      duration: status.duration || currentSong.duration || 0,
    }).catch((err) => console.error("Error updating metadata:", err));
  }, [currentSong, status.duration]);

  /**
   * LOOK-AHEAD AUTOMATION EFFECT
   * Seamlessly builds chunks using user entries first, then album lists, then radio fallbacks
   */
  useEffect(() => {
    if (currentIndex === -1 || queue.length === 0) return;

    const songsRemaining = queue.length - 1 - currentIndex;

    if (songsRemaining <= 5) {
      const storage = internalQueueRef.current;
      const fullPool = [...storage.userQueue, ...storage.contextQueue];

      if (fullPool.length > queue.length) {
        const nextBatch = fullPool.slice(queue.length, queue.length + 10);
        setQueue((prev) => [...prev, ...nextBatch]);
      }

      // Procedural/Infinite Radio Generation
      if (fullPool.length <= queue.length) {
        const lastSong = queue[queue.length - 1];

        fetchThemeOrRandomQueue(lastSong, 10).then((nextTracks) => {
          if (nextTracks.length > 0) {
            const flaggedTracks = nextTracks.map((track) => ({
              ...track,
              origin: "auto" as const,
            }));
            internalQueueRef.current.contextQueue.push(...flaggedTracks);
            setQueue((prev) => [...prev, ...flaggedTracks]);
          }
        });
      }
    }
  }, [currentIndex, queue.length]);

  const loadSongAtIndex = useCallback(
    async (index: number, targetQueue = stateRef.current.queue) => {
      if (index < 0 || index >= targetQueue.length) return;

      const targetSong = targetQueue[index];
      const url = await getStreamUrl(targetSong.id);
      if (!url) return;

      setCurrentIndex(index);
      player.replace({ uri: url });
      player.play();
    },
    [player],
  );

  // Lockscreen Event Listener
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

  // Sync Playback State (activated when playback state or song changes)
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
      if (
        stateRef.current.queue[stateRef.current.currentIndex]?.id === song.id
      ) {
        if (player.playing) player.pause();
        else player.play();
        return;
      }

      const url = await getStreamUrl(song.id);
      if (!url) return;

      // Wipe stale explicit queue allocations
      internalQueueRef.current.userQueue = [];

      const userTracks = [{ ...song, origin: "user" as const }];
      if (contextSongs && contextSongs.length > 0) {
        const idx = contextSongs.findIndex((s) => s.id === song.id);
        const relativeContext =
          idx !== -1 ? contextSongs.slice(idx) : contextSongs;

        const flaggedContext = relativeContext.map((s) => ({
          ...s,
          origin: "user" as const,
        }));

        internalQueueRef.current.contextQueue = flaggedContext;
        setQueue(flaggedContext.slice(0, 10));
        setCurrentIndex(0);
      } else {
        internalQueueRef.current.contextQueue = [];
        setQueue(userTracks);
        setCurrentIndex(0);
      }

      player.replace({ uri: url });
      player.play();
    },
    [player],
  );

  const addToQueue = useCallback(
    (song: Song) => {
      const storage = internalQueueRef.current;

      const flaggedSong = { ...song, origin: "user" as const };
      storage.userQueue.push(flaggedSong);
      setQueue((prev) => {
        if (prev.length === 0) {
          storage.userQueue.push(song);
          setTimeout(() => playSongNow(song), 0);
          return [song];
        }

        const userItemsAhead = storage.userQueue.length;
        const targetInsertionIndex = currentIndex + 1 + userItemsAhead;

        storage.userQueue.push(song);

        const updated = [...prev];
        updated.splice(targetInsertionIndex, 0, flaggedSong);
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

  const updateQueueOrder = useCallback((newQueue: Song[]) => {
    setQueue(newQueue);
    internalQueueRef.current.contextQueue = [...newQueue];
    internalQueueRef.current.userQueue = [];
  }, []);

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

  // Auto-advance track handler
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
