import { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAudioStore } from "@/Stores/useAudioStore";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { Song } from "@/Models/Models";
import { SongOptionsModal } from "@/Components/SongOptionsModal";
import { ItemFlatList } from "@/Components/Optimized/ItemListDisplay";

type SectionType = "tracks" | "albums" | "artists";

export default function HomeScreen() {
  const { navidromeCreds } = useAuth();
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState<SectionType>("tracks");
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const storePlaySongNow = useAudioStore((state) => state.playSongNow);
  const storeAddToQueue = useAudioStore((state) => state.addToQueue);

  const handlePlaySongNow = useCallback(
    async (song: Song, contextSongs?: Song[]) => {
      try {
        const songContext = contextSongs || [song];
        await storePlaySongNow(song, songContext, { type: "home" }, showToast);
      } catch {}
    },
    [storePlaySongNow, showToast],
  );

  const handleSwipeAddToQueue = useCallback(
    (song: Song) => {
      storeAddToQueue(song, showToast, {
        type: "home",
        songIndex: 0,
      });
    },
    [storeAddToQueue, showToast],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Dashboard Feed</Text>

      <View style={styles.tabBar}>
        {(["tracks", "albums", "artists"] as SectionType[]).map((section) => (
          <TouchableOpacity
            key={section}
            style={[
              styles.tabButton,
              activeSection === section && styles.tabButtonActive,
            ]}
            onPress={() => {
              setActiveSection(section);
            }}
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
        ))}
      </View>

      <ItemFlatList
        activeSection={activeSection}
        navidromeCreds={navidromeCreds}
        onPlay={handlePlaySongNow}
        onOptionsPress={(s) => {
          setSelectedSong(s);
          setIsModalVisible(true);
        }}
        onSwipe={handleSwipeAddToQueue}
        context={{ type: "home" }}
      />

      <SongOptionsModal
        visible={isModalVisible}
        song={selectedSong}
        onClose={() => setIsModalVisible(false)}
        onAddToQueue={(s) => storeAddToQueue(s, showToast)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  header: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
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
    color: "#1DB954",
  },
});
