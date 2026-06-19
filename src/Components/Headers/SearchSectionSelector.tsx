import React from "react";
import { create } from "zustand";
import {
  GenericSectionHeader,
  GenericVisibilityContainer,
} from "@/Components/Headers/GenericSectionSelector";

export type SearchSectionType = "tracks" | "albums" | "artists";
const TABS: SearchSectionType[] = ["tracks", "albums", "artists"];

interface SearchTabState {
  activeSection: SearchSectionType;
  setActiveSection: (section: SearchSectionType) => void;
}

export const useSearchTabStore = create<SearchTabState>((set) => ({
  activeSection: "tracks",
  setActiveSection: (section) => set({ activeSection: section }),
}));

export function SearchSectionHeader() {
  const { activeSection, setActiveSection } = useSearchTabStore();
  return (
    <GenericSectionHeader
      tabs={TABS}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
    />
  );
}

export function SearchSectionVisibilityContainer({
  targetSection,
  children,
}: {
  targetSection: SearchSectionType;
  children: React.ReactNode;
}) {
  const activeSection = useSearchTabStore((state) => state.activeSection);
  return (
    <GenericVisibilityContainer
      activeSection={activeSection}
      targetSection={targetSection}
    >
      {children}
    </GenericVisibilityContainer>
  );
}
