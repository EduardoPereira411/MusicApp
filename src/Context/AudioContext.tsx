import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
  AudioPlayer,
} from "expo-audio";
import MediaControl, { Command, PlaybackState } from "expo-media-control";
import {
  getStreamUrl,
  fetchThemeOrRandomQueue,
} from "@/Services/navidromeService";

interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  artworkUrl?: string;
}

interface AudioContextType {
  currentSong: Song | null;
  queue: Song[];
  currentIndex: number;
  playing: boolean;
  player: AudioPlayer;
  playSongNow: (song: Song, contextSongs?: Song[]) => Promise<void>;
  addToQueue: (song: Song) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlayPause: () => void;
  seekTo: (seconds: number) => void;
  removeFromQueue: (index: number) => void;
  skipToQueueIndex: (index: number) => void;
  updateQueueOrder: (newQueue: Song[]) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);

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

      if (contextSongs && contextSongs.length > 0) {
        const idx = contextSongs.findIndex((s) => s.id === song.id);
        if (idx !== -1) {
          setQueue(contextSongs);
          setCurrentIndex(idx);
        } else {
          setQueue([song, ...contextSongs]);
          setCurrentIndex(0);
        }
      } else {
        setQueue([song]);
        setCurrentIndex(0);
      }

      player.replace({ uri: url });
      player.play();

      if (!contextSongs) {
        const proceduralTracks = await fetchThemeOrRandomQueue(song);
        if (proceduralTracks.length > 0) {
          setQueue([song, ...proceduralTracks]);
        }
      }
    },
    [player],
  );

  const addToQueue = useCallback(
    (song: Song) => {
      setQueue((prev) => {
        const updated = [...prev, song];
        if (prev.length === 0) {
          setTimeout(() => playSongNow(song), 0);
        }
        return updated;
      });
    },
    [playSongNow],
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
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player]);

  const seekTo = useCallback(
    (seconds: number) => {
      player?.seekTo(seconds);
    },
    [player],
  );

  const removeFromQueue = useCallback(
    (indexToRemove: number) => {
      setQueue((prevQueue) => {
        if (indexToRemove < 0 || indexToRemove >= prevQueue.length)
          return prevQueue;
        const updatedQueue = prevQueue.filter(
          (_, idx) => idx !== indexToRemove,
        );

        // Correct the currentIndex pointers based on deletion
        if (currentIndex === indexToRemove) {
          if (updatedQueue.length === 0) {
            setCurrentIndex(-1);
            player.pause();
          } else {
            // Play next track or previous if deleted the last item
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
  }, []);
  // Auto-advance track handler
  useEffect(() => {
    if (
      currentSong &&
      !status.playing &&
      status.currentTime > 0 &&
      status.currentTime >= (status.duration || 1)
    ) {
      if (currentIndex < queue.length - 1) {
        playNext();
      } else {
        // Clear out all queue when last song is finished
        setCurrentIndex(-1);
        setQueue([]);
      }
    }
  }, [
    status.playing,
    status.currentTime,
    status.duration,
    currentIndex,
    queue.length,
    currentSong,
    playNext,
  ]);

  const contextValue = useMemo(
    () => ({
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
    }),
    [
      currentSong,
      queue,
      currentIndex,
      status.playing,
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
    ],
  );

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context)
    throw new Error("useAudio must be used within an AudioProvider");
  return context;
}
