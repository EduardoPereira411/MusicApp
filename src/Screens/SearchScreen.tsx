import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { searchAll } from "@/Services/navidromeService";
import { useAuth } from "@/Context/AuthContext";
import { useAudio } from "@/Context/AudioContext";
import { Song, SharedCollectionData } from "@/Models/Models";
import { SongItem } from "@/Components/SongItem";
import { SongOptionsModal } from "@/Components/SongOptionsModal";
import { useRouter } from "expo-router";
import { SearchBar } from "@/Components/SearchBar";
import { MediaCollectionItem } from "@/Components/MediaCollectionItem";
import { ErrorDisplay } from "@/Components/ErrorDisplay";

type SearchType = "tracks" | "albums" | "artists";

export default function SearchScreen() {
  const router = useRouter();
  const { navidromeCreds } = useAuth();

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchType>("tracks");
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<SharedCollectionData[]>([]);
  const [artists, setArtists] = useState<SharedCollectionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { currentSong, playing, playSongNow, addToQueue, playbackContext } =
    useAudio();

  useEffect(() => {
    if (!query.trim()) {
      setSongs([]);
      setAlbums([]);
      setArtists([]);
      setPipelineError(null);
      return;
    }

    const delayDebounce = setTimeout(() => {
      executeSearch();
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [query, navidromeCreds]);

  async function executeSearch() {
    if (!query.trim() || !navidromeCreds) return;
    setLoading(true);
    setPipelineError(null);

    try {
      const result = await searchAll(navidromeCreds, query);
      setSongs(result.songs || []);
      setAlbums(result.albums || []);
      setArtists(result.artists || []);
    } catch (e: any) {
      setPipelineError(
        e.message || "Failed to finalize content search parameters.",
      );
    } finally {
      setLoading(false);
    }
  }

  const handleSongOptions = useCallback((song: Song) => {
    setSelectedSong(song);
    setIsModalVisible(true);
  }, []);

  const handlePlaySongNow = useCallback(
    async (song: Song) => {
      try {
        await playSongNow(song, undefined, { type: "search" });
      } catch {}
    },
    [playSongNow],
  );

  const renderSearchItem = useCallback(
    ({ item }: { item: Song | SharedCollectionData }) => {
      if (activeTab === "tracks") {
        const songItem = item as Song;

        const isCurrent =
          songItem.id === currentSong?.id && playbackContext?.type === "search";

        return (
          <SongItem
            item={songItem}
            isCurrent={isCurrent}
            isPlaying={isCurrent && playing}
            onPlay={handlePlaySongNow}
            onOptionsPress={handleSongOptions}
            onSwipeLeftToRight={addToQueue}
          />
        );
      } else {
        return <MediaCollectionItem item={item as SharedCollectionData} />;
      }
    },
    [
      activeTab,
      currentSong?.id,
      playbackContext,
      playing,
      handlePlaySongNow,
      handleSongOptions,
      addToQueue,
    ],
  );

  const listConfig = useMemo(() => {
    switch (activeTab) {
      case "tracks":
        return songs;
      case "albums":
        return albums;
      case "artists":
        return artists;
    }
  }, [activeTab, songs, albums, artists]);

  const keyExtractor = useCallback(
    (item: Song | SharedCollectionData) => item.id,
    [],
  );

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

      <SearchBar
        placeholder="Artists, songs, or albums"
        value={query}
        onChangeText={setQuery}
      />

      <View style={styles.tabBar}>
        {(["tracks", "albums", "artists"] as SearchType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              activeTab === tab && styles.tabButtonActive,
            ]}
            onPress={() => {
              setPipelineError(null);
              setActiveTab(tab);
            }}
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

      <ErrorDisplay
        title="Search Routine Exception"
        message={pipelineError}
        onRetry={executeSearch}
        retryButtonTitle="Re-run Search Query"
      />

      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#1DB954" />
          </View>
        ) : (
          <FlatList<Song | SharedCollectionData>
            data={listConfig}
            keyExtractor={keyExtractor}
            renderItem={renderSearchItem}
            contentContainerStyle={styles.listContainer}
            initialNumToRender={7}
            maxToRenderPerBatch={5}
            windowSize={2}
            removeClippedSubviews={true}
            ListEmptyComponent={
              !pipelineError ? (
                query.trim() ? (
                  <Text style={styles.emptyText}>
                    No results found for "{query}"
                  </Text>
                ) : (
                  <Text style={styles.emptyText}>
                    Type something to begin your search.
                  </Text>
                )
              ) : null
            }
          />
        )}
      </View>

      <SongOptionsModal
        visible={isModalVisible}
        song={selectedSong}
        onClose={() => setIsModalVisible(false)}
        onAddToQueue={addToQueue}
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  listContainer: {
    paddingBottom: 100,
  },
  emptyText: {
    color: "#b3b3b3",
    textAlign: "center",
    marginTop: 40,
  },
});
