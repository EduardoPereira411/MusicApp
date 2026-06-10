// @/app/search.tsx (or wherever your SearchScreen file lives)
import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { useAudioStore } from "@/Stores/useAudioStore";
import { Song } from "@/Models/Models";
import { SongOptionsModal } from "@/Components/SongOptionsModal";
import { useRouter } from "expo-router";
import { SearchPageList } from "@/Components/ItemLists/SearchPageList";
import {
  SearchSectionHeader,
  SearchSectionVisibilityContainer,
} from "@/Components/Headers/SearchSectionSelector";
import IndependentUpdateTextInput from "@/Components/TextInputs/IndependentUpdateTextInput";

export const SEARCH_PLAYBACK_CONTEXT = {
  type: "search" as const,
  songIndex: 0,
};

export default function SearchScreen() {
  const router = useRouter();
  const { navidromeCreds } = useAuth();
  const { showToast } = useToast();

  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const storePlaySongNow = useAudioStore((state) => state.playSongNow);
  const storeAddToQueue = useAudioStore((state) => state.addToQueue);

  const handlePlaySongNow = useCallback(
    async (song: Song) => {
      try {
        await storePlaySongNow(song, [song], { type: "search" }, showToast);
      } catch {}
    },
    [storePlaySongNow, showToast],
  );

  const handleSwipeAddToQueue = useCallback(
    (track: Song) => {
      storeAddToQueue(track, showToast, SEARCH_PLAYBACK_CONTEXT);
    },
    [storeAddToQueue, showToast],
  );

  const handleSongOptions = useCallback((song: Song) => {
    setSelectedSong(song);
    setIsModalVisible(true);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Search</Text>
        <TouchableOpacity
          style={styles.downloaderButton}
          onPress={() => router.push("/download-search")}
        >
          <Text style={styles.downloaderButtonText}>Go to Downloader</Text>
        </TouchableOpacity>
      </View>

      <IndependentUpdateTextInput
        textId="search-menu"
        placeholder="Artists, songs, or albums"
        debounceDelay={600}
      />

      <SearchSectionHeader />

      <View style={styles.screenWrapper}>
        <SearchSectionVisibilityContainer targetSection="tracks">
          <SearchPageList
            activeSection="tracks"
            navidromeCreds={navidromeCreds}
            onPlay={handlePlaySongNow}
            onOptionsPress={handleSongOptions}
            onSwipe={handleSwipeAddToQueue}
            context={SEARCH_PLAYBACK_CONTEXT}
          />
        </SearchSectionVisibilityContainer>

        <SearchSectionVisibilityContainer targetSection="albums">
          <SearchPageList
            activeSection="albums"
            navidromeCreds={navidromeCreds}
            onPlay={handlePlaySongNow}
            onOptionsPress={handleSongOptions}
            onSwipe={handleSwipeAddToQueue}
            context={SEARCH_PLAYBACK_CONTEXT}
          />
        </SearchSectionVisibilityContainer>

        <SearchSectionVisibilityContainer targetSection="artists">
          <SearchPageList
            activeSection="artists"
            navidromeCreds={navidromeCreds}
            onPlay={handlePlaySongNow}
            onOptionsPress={handleSongOptions}
            onSwipe={handleSwipeAddToQueue}
            context={SEARCH_PLAYBACK_CONTEXT}
          />
        </SearchSectionVisibilityContainer>
      </View>

      <SongOptionsModal
        visible={isModalVisible}
        song={selectedSong}
        onClose={() => setIsModalVisible(false)}
        onAddToQueue={(song) => storeAddToQueue(song, showToast)}
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  header: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  downloaderButton: {
    backgroundColor: "#282828",
    padding: 8,
    borderRadius: 20,
  },
  downloaderButtonText: {
    color: "#00A3FF",
    fontWeight: "bold",
    fontSize: 13,
  },
  screenWrapper: {
    flex: 1,
  },
});
