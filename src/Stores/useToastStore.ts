// @/Stores/useToastStore.ts
import { create } from "zustand";

export type ToastType = "success" | "error";

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  toastId: number;
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  visible: false,
  message: "",
  type: "success",
  toastId: 0,
  showToast: (message, type = "success") =>
    set({
      visible: true,
      message,
      type,
      toastId: Date.now(),
    }),
  dismissToast: () => set({ visible: false }),
}));
