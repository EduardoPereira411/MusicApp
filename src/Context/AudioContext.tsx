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
import { authStorage, getSubsonicAuthParams } from "../Services/subsonicAuth";
import MediaControl, { Command, PlaybackState } from "expo-media-control";

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
  playSongNow: (song: Song) => void;
  addToQueue: (song: Song) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlayPause: () => void;
  seekTo: (seconds: number) => void;
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

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "doNotMix",
      shouldPlayInBackground: true,
    }).catch((err) => console.error("Error setting audio mode:", err));
  }, []);

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
    });

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
  }, [currentSong, status.duration]);

  useEffect(() => {
    if (!currentSong) return;

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

    return () => {
      removeListener();
    };
  }, [currentSong, player]);

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
  }, [status.playing, status.currentTime, currentSong]);

  const getStreamUrl = async (songId: string): Promise<string | null> => {
    try {
      const creds = await authStorage.getCredentials();
      const params = await getSubsonicAuthParams();
      if (!creds || !params) return null;
      return `${creds.serverUrl}/rest/stream.view?${params}&id=${songId}`;
    } catch (e) {
      console.error("Error generating stream link:", e);
      return null;
    }
  };

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

  const playSongNow = useCallback(
    async (song: Song) => {
      if (
        stateRef.current.queue[stateRef.current.currentIndex]?.id === song.id
      ) {
        if (player.playing) player.pause();
        else player.play();
        return;
      }

      const url = await getStreamUrl(song.id);
      if (!url) return;

      setQueue([song]);
      setCurrentIndex(0);

      player.replace({ uri: url });
      player.play();
    },
    [player],
  );

  const addToQueue = useCallback(
    (song: Song) => {
      setQueue((prev) => {
        const updated = [...prev, song];
        if (prev.length === 0) {
          // Safe to call decoupled logic asynchronously
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
    } else {
      console.log("Queue complete.");
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

  // Monitor playback progression to auto-advance
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

  // Stabilize provider context value mapping object reference
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
