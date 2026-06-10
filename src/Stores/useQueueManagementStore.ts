import { create } from "zustand";

interface QueueManagementState {
  isModalVisible: boolean;
  openQueueModal: () => void;
  closeQueueModal: () => void;
}

export const useQueueManagementStore = create<QueueManagementState>((set) => ({
  isModalVisible: false,
  openQueueModal: () => set({ isModalVisible: true }),
  closeQueueModal: () => set({ isModalVisible: false }),
}));
