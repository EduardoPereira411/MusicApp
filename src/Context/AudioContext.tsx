import React, { createContext, useContext } from "react";
import { AudioPlayer } from "expo-audio";
import { Song, QueueSong, PlaybackContext } from "@/Models/Models";
import { useAudioEngine } from "@/CustomHooks/useAudioEngine";

interface AudioContextType {
  currentSong: QueueSong | null;
  queue: QueueSong[];
  playingSongQueueIndex: number;
  playing: boolean;
  player: AudioPlayer;
  playSongNow: (
    song: Song,
    contextSongs?: Song[],
    contextInfo?: PlaybackContext,
  ) => Promise<void>;
  playbackContext: PlaybackContext | null;
  addToQueue: (song: Song) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlayPause: () => void;
  seekTo: (seconds: number) => void;
  removeFromQueue: (index: number) => void;
  skipToQueueIndex: (index: number) => void;
  updateQueueOrder: (newQueue: QueueSong[]) => void;
  logoutCleanUp: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioEngine = useAudioEngine();

  return (
    <AudioContext.Provider value={audioEngine}>
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
