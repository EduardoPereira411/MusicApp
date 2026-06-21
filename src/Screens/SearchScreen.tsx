import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { useAudioActions } from "@/Stores/useAudioStore";
import { Song } from "@/Models/Models";
import { SongOptionsModal } from "@/Components/Modals/SongOptionsModal";
import { useRouter } from "expo-router";
import { SearchPageList } from "@/Components/ItemLists/SearchPageList";
import {
  SearchSectionHeader,
  SearchSectionVisibilityContainer,
} from "@/Components/Headers/SearchSectionSelector";
import IndependentUpdateTextInput from "@/Components/TextInputs/IndependentUpdateTextInput";
import { useTextInputStore } from "@/Stores/useTextInputStore";

export const SEARCH_PLAYBACK_CONTEXT = {
  type: "search" as const,
  songIndex: 0,
};

const SuggestionBanner = () => {
  const router = useRouter();
  const searchQuery = useTextInputStore(
    (state) => state.texts["search-menu"] || "",
  );

  const handleBannerPress = () => {
    const currentQuery =
      useTextInputStore.getState().texts["search-menu"] || "";

    if (currentQuery.trim()) {
      useTextInputStore.getState().setTexts("download-search", currentQuery);
    }

    router.push({
      pathname: "/download-search",
      params: { q: currentQuery },
    });
  };

  const hasQuery = searchQuery.trim().length > 0;

  return (
    <TouchableOpacity
      style={styles.suggestionBanner}
      onPress={handleBannerPress}
      activeOpacity={0.8}
    >
      <View style={styles.bannerTextGroup}>
        <Text style={styles.suggestionTitle}>
          {hasQuery
            ? "Not finding what you're looking for?"
            : "Song not present on the server?"}
        </Text>
        <Text style={styles.suggestionSubtitle} numberOfLines={1}>
          {hasQuery
            ? `Search & import "${searchQuery}" via YouTube Music ➔`
            : "Go to Downloader to get it ➔"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function SearchScreen() {
  const router = useRouter();
  const { navidromeCreds } = useAuth();
  const { showToast } = useToast();

  const { playSongNow: storePlaySongNow, addToQueue: storeAddToQueue } =
    useAudioActions();

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

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Search</Text>
      </View>

      <IndependentUpdateTextInput
        textId="search-menu"
        placeholder="Artists, songs, or albums"
        debounceDelay={600}
      />

      <SuggestionBanner />

      <SearchSectionHeader />

      <View style={styles.screenWrapper}>
        <SearchSectionVisibilityContainer targetSection="tracks">
          <SearchPageList
            activeSection="tracks"
            navidromeCreds={navidromeCreds}
            onPlay={handlePlaySongNow}
            onSwipe={handleSwipeAddToQueue}
            context={SEARCH_PLAYBACK_CONTEXT}
          />
        </SearchSectionVisibilityContainer>

        <SearchSectionVisibilityContainer targetSection="albums">
          <SearchPageList
            activeSection="albums"
            navidromeCreds={navidromeCreds}
            onPlay={handlePlaySongNow}
            onSwipe={handleSwipeAddToQueue}
            context={SEARCH_PLAYBACK_CONTEXT}
          />
        </SearchSectionVisibilityContainer>

        <SearchSectionVisibilityContainer targetSection="artists">
          <SearchPageList
            activeSection="artists"
            navidromeCreds={navidromeCreds}
            onPlay={handlePlaySongNow}
            onSwipe={handleSwipeAddToQueue}
            context={SEARCH_PLAYBACK_CONTEXT}
          />
        </SearchSectionVisibilityContainer>
      </View>

      <SongOptionsModal />
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
  screenWrapper: {
    flex: 1,
  },
  suggestionBanner: {
    backgroundColor: "#1e1e1e",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    padding: 10,
    marginBottom: 5,
  },
  bannerTextGroup: {
    flexDirection: "column",
  },
  suggestionTitle: {
    color: "#b3b3b3",
    fontSize: 13,
    fontWeight: "500",
  },
  suggestionSubtitle: {
    color: "#00A3FF",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 4,
  },
});
