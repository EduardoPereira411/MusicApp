import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface GenericSectionSelectorProps<T extends string> {
  tabs: T[];
  activeSection: T;
  setActiveSection: (section: T) => void;
  activeTextColor?: string;
}

export function GenericSectionHeader<T extends string>({
  tabs,
  activeSection,
  setActiveSection,
  activeTextColor = "#1DB954",
}: GenericSectionSelectorProps<T>) {
  return (
    <View style={styles.tabBar}>
      {tabs.map((section) => (
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
              activeSection === section && { color: activeTextColor },
            ]}
          >
            {section.toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

interface VisibilityContainerProps<T extends string> {
  activeSection: T;
  targetSection: T;
  children: React.ReactNode;
}

export function GenericVisibilityContainer<T extends string>({
  activeSection,
  targetSection,
  children,
}: VisibilityContainerProps<T>) {
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
  visibleContainer: { flex: 1 },
  hiddenContainer: { display: "none" },
});
