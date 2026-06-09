// @/Components/Headers/SearchSectionSelector.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { create } from "zustand";

export type SearchSectionType = "tracks" | "albums" | "artists";

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
    <View style={styles.tabBar}>
      {(["tracks", "albums", "artists"] as SearchSectionType[]).map(
        (section) => (
          <TouchableOpacity
            key={section}
            style={[
              styles.tabButton,
              activeSection === section && styles.tabButtonActive,
            ]}
            onPress={() => setActiveSection(section)}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeSection === section && styles.tabButtonTextActive,
              ]}
            >
              {section.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ),
      )}
    </View>
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
    <View
      style={
        activeSection === targetSection
          ? styles.visibleContainer
          : styles.hiddenContainer
      }
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  tabButtonActive: { backgroundColor: "#282828" },
  tabButtonText: { color: "#888888", fontSize: 12, fontWeight: "bold" },
  tabButtonTextActive: { color: "#1DB954" },
  visibleContainer: { flex: 1 },
  hiddenContainer: { display: "none" },
});
