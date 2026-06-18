import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import IndependentUpdateTextInput from "@/Components/TextInputs/IndependentUpdateTextInput";
import { useDownloadAuth } from "@/Context/DownloadContext";
import { useTextInputStore } from "@/Stores/useTextInputStore";

import { DownloadTracksList } from "@/Components/ItemLists/DownloadTracksList";
import { DownloadAlbumsList } from "@/Components/ItemLists/DownloadAlbumsList";

type SearchType = "tracks" | "albums" | "artists";

export default function DownloadSearchScreen() {
  const router = useRouter();
  const { downloadCreds } = useDownloadAuth();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [activeTab, setActiveTab] = useState<SearchType>("tracks");

  useEffect(() => {
    if (q) {
      useTextInputStore.getState().setTexts("download-search", q);
    }
  }, [q]);

  useEffect(() => {
    if (!downloadCreds) {
      Alert.alert(
        "Setup Required",
        "Please configure your Download API server credentials in the Profile tab first.",
      );
    }
  }, [downloadCreds]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRowContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <View style={styles.titleTextGroup}>
          <Text style={styles.header}>Download Music</Text>
          <Text style={styles.subHeader}>
            Search & import tracks directly into your server
          </Text>
        </View>
      </View>

      <IndependentUpdateTextInput
        textId="download-search"
        debounceDelay={600}
        placeholder="Search YouTube Music..."
      />

      <View style={styles.tabBar}>
        {(["tracks", "albums", "artists"] as SearchType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              activeTab === tab && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab && styles.tabButtonTextActive,
              ]}
            >
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === "tracks" && (
          <DownloadTracksList downloadCreds={downloadCreds} />
        )}
        {activeTab === "albums" && (
          <DownloadAlbumsList downloadCreds={downloadCreds} />
        )}
        {activeTab === "artists" && (
          <View style={styles.notImplementedContainer}>
            <Text style={styles.notImplementedText}>
              Not implemented yet, sowy :(
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 16,
  },
  headerRowContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 60,
    marginBottom: 16,
  },
  backButton: {
    paddingRight: 14,
    paddingTop: 2,
  },
  titleTextGroup: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  subHeader: {
    color: "#666",
    fontSize: 13,
    marginTop: 2,
  },
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
    color: "#00A3FF",
  },
  notImplementedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notImplementedText: {
    color: "#b3b3b3",
    fontSize: 15,
    fontStyle: "italic",
  },
});
