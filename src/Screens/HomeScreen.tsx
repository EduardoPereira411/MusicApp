import { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useAudio } from "@/Context/AudioContext";
import { useAuth } from "@/Context/AuthContext";
import { Song, SharedCollectionData } from "@/Models/Models";
import { SongItem } from "@/Components/SongItem";
import { SongOptionsModal } from "@/Components/SongOptionsModal";
import { MediaCollectionItem } from "@/Components/MediaCollectionItem";
import {
  fetchTracks,
  fetchAlbums,
  fetchArtists,
} from "@/Services/navidromeService";

type SectionType = "tracks" | "albums" | "artists";

export default function HomeScreen() {
  const { navidromeCreds } = useAuth();
  const [activeSection, setActiveSection] = useState<SectionType>("tracks");
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<SharedCollectionData[]>([]);
  const [artists, setArtists] = useState<SharedCollectionData[]>([]);

  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const { currentSong, playing, playSongNow, addToQueue } = useAudio();

  const handleSongOptions = useCallback((song: Song) => {
    setSelectedSong(song);
    setIsModalVisible(true);
  }, []);

  useEffect(() => {
    if (!navidromeCreds) return;

    async function fetchAllDataInitial() {
      setInitialLoading(true);
      try {
        const [tracksData, albumsData, artistsData] = await Promise.all([
          fetchTracks(navidromeCreds!),
          fetchAlbums(navidromeCreds!),
          fetchArtists(navidromeCreds!),
        ]);
        setSongs(tracksData);
        setAlbums(albumsData);
        setArtists(artistsData);
      } catch (err) {
        console.error("Failed to fetch dashboard feed metrics:", err);
      } finally {
        setInitialLoading(false);
      }
    }

    fetchAllDataInitial();
  }, [navidromeCreds]);

  async function handleRefresh() {
    if (!navidromeCreds) return;
    setIsRefreshing(true);

    try {
      if (activeSection === "tracks") {
        setSongs(await fetchTracks(navidromeCreds));
      } else if (activeSection === "albums") {
        setAlbums(await fetchAlbums(navidromeCreds));
      } else if (activeSection === "artists") {
        setArtists(await fetchArtists(navidromeCreds));
      }
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  }

  const renderSongItem = useCallback(
    ({ item }: { item: Song | SharedCollectionData }) => {
      if (activeSection === "tracks") {
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
      activeSection,
      currentSong?.id,
      playing,
      playSongNow,
      handleSongOptions,
      addToQueue,
    ],
  );

  const listConfig = useMemo(() => {
    switch (activeSection) {
      case "tracks":
        return { data: songs, emptyText: "No tracks found." };
      case "albums":
        return { data: albums, emptyText: "No albums found." };
      case "artists":
        return { data: artists, emptyText: "No artists found." };
    }
  }, [activeSection, songs, albums, artists]);

  const keyExtractor = useCallback(
    (item: Song | SharedCollectionData) => item.id,
    [],
  );

  if (initialLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

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
        ))}
      </View>

      <View style={{ flex: 1 }}>
        <FlatList<Song | SharedCollectionData>
          data={listConfig.data}
          keyExtractor={keyExtractor}
          renderItem={renderSongItem}
          contentContainerStyle={styles.listContainer}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#1DB954"
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>{listConfig.emptyText}</Text>
          }
        />
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
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
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
  listContainer: {
    paddingBottom: 100,
  },
  emptyText: {
    color: "#b3b3b3",
    textAlign: "center",
    marginTop: 40,
  },
});
