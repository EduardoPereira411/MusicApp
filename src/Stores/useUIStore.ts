import { create } from "zustand";

interface UiState {
  modals: Record<string, boolean>;
  modalData: Record<string, any>;

  openModal: (id: string, data?: any) => void;
  closeModal: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  modals: {},
  modalData: {},

  openModal: (id, data = null) =>
    set((state) => ({
      modals: { ...state.modals, [id]: true },
      modalData: { ...state.modalData, [id]: data },
    })),

  closeModal: (id) =>
    set((state) => {
      const nextModals = { ...state.modals, [id]: false };
      const nextData = { ...state.modalData };
      delete nextData[id];

      return { modals: nextModals, modalData: nextData };
    }),
}));
