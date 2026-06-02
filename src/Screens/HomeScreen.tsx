import { useEffect, useState } from "react";
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
import { SongItem, Song } from "@/Components/SongItem";
import { AlbumItem, Album } from "@/Components/AlbumItem";
import { ArtistItem, Artist } from "@/Components/ArtistItem";
import { SongOptionsModal } from "@/Components/SongOptionsModal";
import {
  fetchTracks,
  fetchAlbums,
  fetchArtists,
} from "@/Services/navidromeService";

type SectionType = "tracks" | "albums" | "artists";

export default function HomeScreen() {
  const [activeSection, setActiveSection] = useState<SectionType>("tracks");
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);

  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const { currentSong, playing, playSongNow, addToQueue } = useAudio();

  const handleSongOptions = (song: Song) => {
    setSelectedSong(song);
    setIsModalVisible(true);
  };

  useEffect(() => {
    async function fetchAllDataInitial() {
      setInitialLoading(true);
      const [tracksData, albumsData, artistsData] = await Promise.all([
        fetchTracks(),
        fetchAlbums(),
        fetchArtists(),
      ]);
      setSongs(tracksData);
      setAlbums(albumsData);
      setArtists(artistsData);
      setInitialLoading(false);
    }

    fetchAllDataInitial();
  }, []);

  async function handleRefresh() {
    setIsRefreshing(true);
    if (activeSection === "tracks") {
      setSongs(await fetchTracks());
    } else if (activeSection === "albums") {
      setAlbums(await fetchAlbums());
    } else if (activeSection === "artists") {
      setArtists(await fetchArtists());
    }
    setIsRefreshing(false);
  }

  const getListDataAndRenderer = (): {
    data: Song[] | Album[] | Artist[];
    emptyText: string;
    renderItem: ({
      item,
    }: {
      item: Song | Album | Artist;
    }) => React.JSX.Element;
  } => {
    switch (activeSection) {
      case "tracks":
        return {
          data: songs,
          emptyText: "No tracks found.",
          renderItem: ({ item }) => (
            <SongItem
              item={item as Song}
              isCurrent={item.id === currentSong?.id}
              isPlaying={item.id === currentSong?.id && playing}
              onPlay={playSongNow}
              onOptionsPress={handleSongOptions}
            />
          ),
        };
      case "albums":
        return {
          data: albums,
          emptyText: "No albums found.",
          renderItem: ({ item }) => <AlbumItem item={item as Album} />,
        };
      case "artists":
        return {
          data: artists,
          emptyText: "No artists found.",
          renderItem: ({ item }) => (
            <ArtistItem
              item={item as Artist}
              onPress={(id) => console.log("Artist:", id)}
            />
          ),
        };
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  const listConfig = getListDataAndRenderer();

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
        <FlatList<Song | Album | Artist>
          data={listConfig.data}
          keyExtractor={(item) => item.id}
          renderItem={listConfig.renderItem}
          contentContainerStyle={styles.listContainer}
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
