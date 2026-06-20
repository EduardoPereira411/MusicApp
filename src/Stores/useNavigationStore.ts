import { create } from "zustand";

interface NavigationState {
  isInTabs: boolean;
  setIsInTabs: (isInTabs: boolean) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  isInTabs: true,
  setIsInTabs: (isInTabs) => set({ isInTabs }),
}));
