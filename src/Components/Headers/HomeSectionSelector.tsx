import React from "react";
import { create } from "zustand";
import {
  GenericSectionHeader,
  GenericVisibilityContainer,
} from "@/Components/Headers/GenericSectionSelector";

export type HomeSectionType = "tracks" | "albums" | "artists";
const TABS: HomeSectionType[] = ["tracks", "albums", "artists"];

interface HomeTabState {
  activeSection: HomeSectionType;
  setActiveSection: (section: HomeSectionType) => void;
}

export const useHomeTabStore = create<HomeTabState>((set) => ({
  activeSection: "tracks",
  setActiveSection: (section) => set({ activeSection: section }),
}));

export function HomeSectionHeader() {
  const { activeSection, setActiveSection } = useHomeTabStore();
  return (
    <GenericSectionHeader
      tabs={TABS}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
    />
  );
}

export function HomeSectionVisibilityContainer({
  targetSection,
  children,
}: {
  targetSection: HomeSectionType;
  children: React.ReactNode;
}) {
  const activeSection = useHomeTabStore((state) => state.activeSection);
  return (
    <GenericVisibilityContainer
      activeSection={activeSection}
      targetSection={targetSection}
    >
      {children}
    </GenericVisibilityContainer>
  );
}
