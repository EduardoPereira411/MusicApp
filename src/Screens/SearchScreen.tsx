import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  authStorage,
  getSubsonicAuthParams,
} from "../Services/navidromeService";
import { useAudio } from "@/Context/AudioContext";
import { SongItem, Song } from "@/Components/SongItem";
import { AlbumItem, Album } from "@/Components/AlbumItem";
import { SongOptionsModal } from "@/Components/SongOptionsModal";

type SearchType = "tracks" | "albums";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchType>("tracks");
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { currentSong, playing, playSongNow, addToQueue } = useAudio();

  // Trigger search when theres a change in the search bar, with delay so server does't get overwhelmed
  useEffect(() => {
    if (!query.trim()) {
      setSongs([]);
      setAlbums([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      executeSearch();
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  async function executeSearch() {
    if (!query.trim()) return;
    setLoading(true);

    try {
      const creds = await authStorage.getCredentials();
      const params = await getSubsonicAuthParams();
      if (!creds || !params) return;

      // search3.view returns tracks, albums, and artists all at once.
      const url = `${creds.serverUrl}/rest/search3.view?${params}&query=${encodeURIComponent(query)}&songCount=30&albumCount=30`;
      const response = await fetch(url);
      const data = await response.json();
      const searchResult = data["subsonic-response"]?.searchResult3;

      // Parse Songs
      const fetchedSongs: any[] = searchResult?.song || [];
      const parsedSongs = (
        Array.isArray(fetchedSongs) ? fetchedSongs : [fetchedSongs]
      ).map((song) => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        albumId: song.albumId,
        artworkUrl: `${creds.serverUrl}/rest/getCoverArt.view?${params}&id=${song.coverArt || song.id}&size=300`,
      }));

      // Parse Albums
      const fetchedAlbums: any[] = searchResult?.album || [];
      const parsedAlbums = (
        Array.isArray(fetchedAlbums) ? fetchedAlbums : [fetchedAlbums]
      ).map((album) => ({
        id: album.id,
        name: album.name,
        artist: album.artist,
        artworkUrl: `${creds.serverUrl}/rest/getCoverArt.view?${params}&id=${album.coverArt || album.id}&size=300`,
      }));

      setSongs(parsedSongs);
      setAlbums(parsedAlbums);
    } catch (e) {
      console.error("Search failed:", e);
    } finally {
      setLoading(false);
    }
  }

  const handleSongOptions = (song: Song) => {
    setSelectedSong(song);
    setIsModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Search</Text>

      {/* Custom Search Bar Bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Artists, songs, or albums"
          placeholderTextColor="#888"
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
          autoCorrect={false}
        />
      </View>

      <View style={styles.tabBar}>
        {(["tracks", "albums"] as SearchType[]).map((tab) => (
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
          <FlatList
            data={(activeTab === "tracks" ? songs : albums) as (Song | Album)[]}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
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
            renderItem={({ item }) => {
              if (activeTab === "tracks") {
                const songItem = item as Song;
                return (
                  <SongItem
                    item={songItem}
                    isCurrent={songItem.id === currentSong?.id}
                    isPlaying={songItem.id === currentSong?.id && playing}
                    onPlay={playSongNow}
                    onOptionsPress={handleSongOptions}
                  />
                );
              } else {
                const albumItem = item as Album;
                return (
                  <AlbumItem
                    item={albumItem}
                    onPress={(id) => console.log("Navigate to Album ID:", id)}
                  />
                );
              }
            }}
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
  header: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  searchBarContainer: {
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: {
    color: "#fff",
    fontSize: 16,
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
