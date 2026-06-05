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

  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { currentSong, playing, playSongNow, addToQueue } = useAudio();

  useEffect(() => {
    if (!query.trim()) {
      setSongs([]);
      setAlbums([]);
      setArtists([]);
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

    try {
      const result = await searchAll(navidromeCreds, query);
      setSongs(result.songs || []);
      setAlbums(result.albums || []);
      setArtists(result.artists || []);
    } catch (e) {
      console.error("Search query execution failed:", e);
    } finally {
      setLoading(false);
    }
  }

  const handleSongOptions = useCallback((song: Song) => {
    setSelectedSong(song);
    setIsModalVisible(true);
  }, []);

  const renderSearchItem = useCallback(
    ({ item }: { item: Song | SharedCollectionData }) => {
      if (activeTab === "tracks") {
        const songItem = item as Song;
        const isCurrent = songItem.id === currentSong?.id;
        return (
          <SongItem
            item={songItem}
            isCurrent={isCurrent}
            isPlaying={isCurrent && playing}
            onPlay={playSongNow}
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
      playing,
      playSongNow,
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
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            ListEmptyComponent={
              query.trim() ? (
                <Text style={styles.emptyText}>
                  No results found for "{query}"
                </Text>
              ) : (
                <Text style={styles.emptyText}>
                  Type something to begin your search.
                </Text>
              )
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
