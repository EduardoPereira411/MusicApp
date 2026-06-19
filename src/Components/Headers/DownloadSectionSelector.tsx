import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { create } from "zustand";

export type DownloadSectionType = "tracks" | "albums" | "artists";

interface DownloadTabState {
  activeSection: DownloadSectionType;
  setActiveSection: (section: DownloadSectionType) => void;
}

export const useDownloadTabStore = create<DownloadTabState>((set) => ({
  activeSection: "tracks",
  setActiveSection: (section) => set({ activeSection: section }),
}));

export function DownloadSectionHeader() {
  const { activeSection, setActiveSection } = useDownloadTabStore();

  return (
    <View style={styles.tabBar}>
      {(["tracks", "albums", "artists"] as DownloadSectionType[]).map(
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

export function DownloadSectionVisibilityContainer({
  targetSection,
  children,
}: {
  targetSection: DownloadSectionType;
  children: React.ReactNode;
}) {
  const activeSection = useDownloadTabStore((state) => state.activeSection);
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
  tabButtonActive: {
    backgroundColor: "#282828",
  },
  tabButtonText: {
    color: "#888888",
    fontSize: 12,
    fontWeight: "bold",
  },
  tabButtonTextActive: {
    color: "#00A3FF", // Matches your downloader's blue theme style
  },
  visibleContainer: {
    flex: 1,
  },
  hiddenContainer: {
    display: "none", // Keeps components mounted but invisible
  },
});
