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
import { Song, Album, Artist } from "@/Models/Models";
import { SongItem } from "@/Components/SongItem";
import { ArtistItem } from "@/Components/ArtistItem";
import { SongOptionsModal } from "@/Components/SongOptionsModal";
import { MediaCollectionItem } from "@/Components/MediaCollectionItem";
import {
  fetchTracks,
  fetchAlbums,
  fetchArtists,
} from "@/Services/navidromeService";
import { SharedCollectionData } from "@/Models/Models";

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

  const handleSongOptions = useCallback((song: Song) => {
    setSelectedSong(song);
    setIsModalVisible(true);
  }, []);

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

  const renderSongItem = useCallback(
    ({ item }: { item: Song | Album | Artist }) => {
      switch (activeSection) {
        case "tracks": {
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
        }
        case "albums": {
          const albumItem = item as Album;

          const transformedAlbum: SharedCollectionData = {
            id: albumItem.id,
            name: albumItem.name,
            type: "album",
            subtitle: albumItem.artist,
            artworkUrl: albumItem.artworkUrl,
            songCount: albumItem.songCount,
          };

          return <MediaCollectionItem item={transformedAlbum} />;
        }
        case "artists":
          return (
            <ArtistItem
              item={item as Artist}
              onPress={(id) => console.log("Artist:", id)}
            />
          );
        default:
          return null;
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
    (item: Song | Album | Artist) => item.id,
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
        <FlatList<Song | Album | Artist>
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
