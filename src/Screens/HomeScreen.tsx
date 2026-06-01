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
import { authStorage, getSubsonicAuthParams } from "../Services/subsonicAuth";
import { useAudio } from "@/Context/AudioContext";
import { SongItem, Song } from "@/Components/SongItem";
import { AlbumItem, Album } from "@/Components/AlbumItem";
import { ArtistItem, Artist } from "@/Components/ArtistItem";

type SectionType = "tracks" | "albums" | "artists";

export default function HomeScreen() {
  const [activeSection, setActiveSection] = useState<SectionType>("tracks");
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);

  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const { currentSong, playing, playSongNow, addToQueue } = useAudio();

  useEffect(() => {
    fetchAllDataInitial();
  }, []);

  async function fetchAllDataInitial() {
    setInitialLoading(true);
    await Promise.all([fetchTracks(), fetchAlbums(), fetchArtists()]);
    setInitialLoading(false);
  }

  async function fetchTracks() {
    try {
      const creds = await authStorage.getCredentials();
      const params = await getSubsonicAuthParams();
      if (!creds || !params) return;

      const url = `${creds.serverUrl}/rest/getRandomSongs.view?${params}&size=20`;
      const response = await fetch(url);
      const data = await response.json();
      const fetchedSongs: any[] =
        data["subsonic-response"]?.randomSongs?.song || [];

      setSongs(
        fetchedSongs.map((song) => ({
          id: song.id,
          title: song.title,
          artist: song.artist,
          album: song.album,
          artworkUrl: `${creds.serverUrl}/rest/getCoverArt.view?${params}&id=${song.coverArt || song.id}&size=300`,
        })),
      );
    } catch (e) {
      console.error("Failed fetching tracks:", e);
    }
  }

  async function fetchAlbums() {
    try {
      const creds = await authStorage.getCredentials();
      const params = await getSubsonicAuthParams();
      if (!creds || !params) return;

      const url = `${creds.serverUrl}/rest/getAlbumList2.view?${params}&type=random&size=20`;
      const response = await fetch(url);
      const data = await response.json();
      const fetchedAlbums: any[] =
        data["subsonic-response"]?.albumList2?.album || [];

      setAlbums(
        fetchedAlbums.map((album) => ({
          id: album.id,
          name: album.name,
          artist: album.artist,
          artworkUrl: `${creds.serverUrl}/rest/getCoverArt.view?${params}&id=${album.coverArt || album.id}&size=300`,
        })),
      );
    } catch (e) {
      console.error("Failed fetching albums:", e);
    }
  }

  async function fetchArtists() {
    try {
      const creds = await authStorage.getCredentials();
      const params = await getSubsonicAuthParams();
      if (!creds || !params) return;

      const url = `${creds.serverUrl}/rest/getArtists.view?${params}`;
      const response = await fetch(url);
      const data = await response.json();

      const indices: any[] = data["subsonic-response"]?.artists?.index || [];
      const fetchedArtists: Artist[] = [];
      indices.forEach((index) => {
        if (index.artist) {
          index.artist.forEach((art: any) => {
            fetchedArtists.push({
              id: art.id,
              name: art.name,
              albumCount: art.albumCount,
            });
          });
        }
      });
      setArtists(fetchedArtists.slice(0, 30));
    } catch (e) {
      console.error("Failed fetching artists:", e);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    if (activeSection === "tracks") await fetchTracks();
    else if (activeSection === "albums") await fetchAlbums();
    else if (activeSection === "artists") await fetchArtists();
    setIsRefreshing(false);
  }

  const getListDataAndRenderer = () => {
    switch (activeSection) {
      case "tracks":
        return {
          data: songs,
          emptyText: "No tracks found.",
          renderItem: ({ item }: { item: any }) => (
            <SongItem
              item={item}
              isCurrent={item.id === currentSong?.id}
              isPlaying={item.id === currentSong?.id && playing}
              onPlay={playSongNow}
              onAddToQueue={addToQueue}
            />
          ),
        };
      case "albums":
        return {
          data: albums,
          emptyText: "No albums found.",
          renderItem: ({ item }: { item: any }) => (
            <AlbumItem
              item={item}
              onPress={(id) => console.log("Album:", id)}
            />
          ),
        };
      case "artists":
        return {
          data: artists,
          emptyText: "No artists found.",
          renderItem: ({ item }: { item: any }) => (
            <ArtistItem
              item={item}
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
        <FlatList
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
