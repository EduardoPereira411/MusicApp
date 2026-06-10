import { create } from "zustand";

interface TextState {
  texts: Record<string, string>;
  setTexts: (id: string, query: string) => void;
}

export const useTextInputStore = create<TextState>((set) => ({
  texts: {
    "search-menu": "",
    "download-search": "",
  },
  setTexts: (id, query) =>
    set((state) => ({
      texts: { ...state.texts, [id]: query },
    })),
}));
