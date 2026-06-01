import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextStyle,
  RefreshControl,
} from "react-native";
import { authStorage, getSubsonicAuthParams } from "../Services/subsonicAuth";
import { useAudio } from "@/Context/AudioContext";
import { Image } from "expo-image";

interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artworkUrl?: string;
}

interface Album {
  id: string;
  name: string;
  artist: string;
  artworkUrl?: string;
}

interface Artist {
  id: string;
  name: string;
  albumCount?: number;
}

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
    if (activeSection === "tracks") {
      await fetchTracks();
    } else if (activeSection === "albums") {
      await fetchAlbums();
    } else if (activeSection === "artists") {
      await fetchArtists();
    }
    setIsRefreshing(false);
  }

  async function playSong(song: Song) {
    playSongNow(song);
  }

  const renderSongItem = ({ item }: { item: Song }) => {
    const isCurrent = item.id === currentSong?.id;
    const isPlaying = isCurrent && playing;

    return (
      <View style={[styles.itemCard, isCurrent && styles.activeCard]}>
        <TouchableOpacity
          style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
          onPress={() => playSong(item)}
        >
          <Image
            source={{ uri: item.artworkUrl }}
            style={styles.cardArt}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.infoContainer}>
            <Text
              style={[styles.mainText, isCurrent && styles.activeText]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text style={styles.subText} numberOfLines={1}>
              {item.artist} {item.album ? `• ${item.album}` : ""}
            </Text>
          </View>
          <Text style={styles.actionStatus}>{isPlaying ? "⏸" : "▶"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ paddingLeft: 12, paddingVertical: 8 }}
          onPress={() => addToQueue(item)}
        >
          <Text style={{ color: "#1DB954", fontSize: 12, fontWeight: "bold" }}>
            + QUEUE
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderAlbumItem = ({ item }: { item: Album }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => console.log("Album selected:", item.id)}
    >
      <Image
        source={{ uri: item.artworkUrl }}
        style={styles.cardArt}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.infoContainer}>
        <Text style={styles.mainText} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.subText} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderArtistItem = ({ item }: { item: Artist }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => console.log("Artist selected:", item.id)}
    >
      <View style={[styles.cardArt, styles.artistAvatarPlaceholder]}>
        <Text style={{ color: "#fff", fontWeight: "bold" }}>
          {item.name.charAt(0)}
        </Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.mainText} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.subText}>
          {item.albumCount ? `${item.albumCount} Albums` : "Artist"}
        </Text>
      </View>
    </TouchableOpacity>
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
        {activeSection === "tracks" && (
          <FlatList
            data={songs}
            keyExtractor={(item) => item.id}
            renderItem={renderSongItem}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#1DB954"
              />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>No tracks found.</Text>
            }
          />
        )}

        {activeSection === "albums" && (
          <FlatList
            data={albums}
            keyExtractor={(item) => item.id}
            renderItem={renderAlbumItem}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#1DB954"
              />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>No albums found.</Text>
            }
          />
        )}

        {activeSection === "artists" && (
          <FlatList
            data={artists}
            keyExtractor={(item) => item.id}
            renderItem={renderArtistItem}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#1DB954"
              />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>No artists found.</Text>
            }
          />
        )}
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
  itemCard: {
    backgroundColor: "#1e1e1e",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  activeCard: {
    backgroundColor: "#282828",
    borderColor: "#1DB954",
    borderWidth: 1,
  },
  cardArt: {
    width: 55,
    height: 55,
    borderRadius: 6,
    backgroundColor: "#333",
    marginRight: 14,
  },
  artistAvatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 27.5,
    backgroundColor: "#444",
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  mainText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  } as TextStyle,
  activeText: {
    color: "#1DB954",
  } as TextStyle,
  subText: {
    color: "#b3b3b3",
    fontSize: 13,
  },
  actionStatus: {
    color: "#1DB954",
    fontSize: 18,
    paddingHorizontal: 8,
  },
  emptyText: {
    color: "#b3b3b3",
    textAlign: "center",
    marginTop: 40,
  },
});
