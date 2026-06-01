import React, { createContext, useContext, useState, useEffect } from "react";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";
import { authStorage, getSubsonicAuthParams } from "../Services/subsonicAuth";

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
  duration: number;
  currentTime: number;
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

  const currentSong =
    currentIndex >= 0 && currentIndex < queue.length
      ? queue[currentIndex]
      : null;

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "doNotMix",
      shouldPlayInBackground: true,
    }).catch((err) => console.error("Error setting audio mode:", err));
  }, []);

  useEffect(() => {
    if (player) {
      if (currentSong) {
        player.setActiveForLockScreen(
          true,
          {
            title: currentSong.title,
            artist: currentSong.artist,
            albumTitle: currentSong.album || "Navidrome Album",
            artworkUrl: currentSong.artworkUrl,
          },
          {
            showSeekForward: true,
            showSeekBackward: true,
          },
        );
      } else {
        player.clearLockScreenControls();
      }
    }
  }, [player, currentSong]);

  async function getStreamUrl(songId: string): Promise<string | null> {
    try {
      const creds = await authStorage.getCredentials();
      const params = await getSubsonicAuthParams();
      if (!creds || !params) return null;
      return `${creds.serverUrl}/rest/stream.view?${params}&id=${songId}`;
    } catch (e) {
      console.error("Error generating stream link:", e);
      return null;
    }
  }

  async function loadSongAtIndex(index: number) {
    if (index < 0 || index >= queue.length) return;

    const targetSong = queue[index];
    const url = await getStreamUrl(targetSong.id);
    if (!url) return;

    setCurrentIndex(index);
    player.replace({ uri: url });
    player.play();
  }

  const playSongNow = async (song: Song) => {
    if (currentSong?.id === song.id) {
      togglePlayPause();
      return;
    }

    const url = await getStreamUrl(song.id);
    if (!url) return;

    const newQueue = [song];
    setQueue(newQueue);
    setCurrentIndex(0);

    player.replace({ uri: url });
    player.play();
  };

  const addToQueue = (song: Song) => {
    setQueue((prev) => [...prev, song]);
    // If nothing was playing, jump right into it
    if (queue.length === 0) {
      setCurrentIndex(0);
      playSongNow(song);
    }
  };

  const playNext = () => {
    if (currentIndex < queue.length - 1) {
      loadSongAtIndex(currentIndex + 1);
    } else {
      console.log("Queue complete.");
    }
  };

  const playPrevious = () => {
    if (currentIndex > 0) {
      loadSongAtIndex(currentIndex - 1);
    }
  };

  const togglePlayPause = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const seekTo = (seconds: number) => {
    if (player) {
      player.seekTo(seconds);
    }
  };

  // Monitor playback progression to auto-advance when a track hits its end
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
  }, [status.playing, status.currentTime, status.duration]);

  return (
    <AudioContext.Provider
      value={{
        currentSong,
        queue,
        currentIndex,
        playing: status.playing,
        duration: status.duration,
        currentTime: status.currentTime,
        playSongNow,
        addToQueue,
        playNext,
        playPrevious,
        togglePlayPause,
        seekTo,
      }}
    >
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
