import React, { createContext, useContext, useState, useEffect } from "react";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";

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
  playing: boolean;
  duration: number;
  currentTime: number;
  playNewSong: (song: Song, streamUrl: string) => void;
  togglePlayPause: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);

  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);

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
        player.setActiveForLockScreen(true, {
          title: currentSong.title,
          artist: currentSong.artist,
          albumTitle: currentSong.album || "Navidrome Album",
          artworkUrl: currentSong.artworkUrl,
        });
      } else {
        player.clearLockScreenControls();
      }
    }
  }, [player, currentSong]);

  useEffect(() => {
    if (
      currentSong &&
      !status.playing &&
      status.currentTime > 0 &&
      status.currentTime >= (status.duration || 1)
    ) {
      setCurrentSong(null);
    }
  }, [status.playing, status.currentTime, status.duration]);

  const playNewSong = (song: Song, url: string) => {
    setCurrentSong(song);

    player.replace({
      uri: url,
    });
    player.play();
  };

  const togglePlayPause = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <AudioContext.Provider
      value={{
        currentSong,
        playing: status.playing,
        duration: status.duration,
        currentTime: status.currentTime,
        playNewSong,
        togglePlayPause,
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
