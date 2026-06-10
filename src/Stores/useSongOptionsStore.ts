import { create } from "zustand";
import { Song } from "@/Models/Models";

interface SongOptionsState {
  isModalVisible: boolean;
  selectedSong: Song | null;
  openSongOptions: (song: Song) => void;
  closeSongOptions: () => void;
}

export const useSongOptionsStore = create<SongOptionsState>((set) => ({
  isModalVisible: false,
  selectedSong: null,
  openSongOptions: (song) => set({ isModalVisible: true, selectedSong: song }),
  closeSongOptions: () => set({ isModalVisible: false, selectedSong: null }),
}));
