import { create } from "zustand";

interface QueueManagementState {
  isPlayerVisible: boolean;
  isQueueVisible: boolean;
  openPlayer: () => void;
  closePlayer: () => void;
  openQueue: () => void;
  closeQueue: () => void;
}

export const useQueueManagementStore = create<QueueManagementState>((set) => ({
  isPlayerVisible: false,
  isQueueVisible: false,
  openPlayer: () => set({ isPlayerVisible: true }),
  closePlayer: () => set({ isPlayerVisible: false, isQueueVisible: false }),
  openQueue: () => set({ isQueueVisible: true }),
  closeQueue: () => set({ isQueueVisible: false }),
}));
