import { create } from "zustand";
import { SearchContextID } from "@/Models/Models";

interface SearchState {
  queries: Record<SearchContextID, string>;
  setQuery: (id: SearchContextID, query: string) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  queries: {
    "search-menu": "",
    "download-search": "",
  },
  setQuery: (id, query) =>
    set((state) => ({
      queries: { ...state.queries, [id]: query },
    })),
}));
