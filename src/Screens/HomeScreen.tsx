import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextStyle,
} from "react-native";
import { authStorage, getSubsonicAuthParams } from "../Services/subsonicAuth";
import { useAudio } from "@/Context/AudioContext";
import { Image } from "expo-image";

interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  artworkUrl?: string;
}

export default function HomeScreen() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { currentSong, playing, playNewSong, togglePlayPause } = useAudio();

  useEffect(() => {
    loadSongs();
  }, []);

  async function loadSongs() {
    try {
      const creds = await authStorage.getCredentials();
      const params = await getSubsonicAuthParams();

      if (!creds || !params) {
        setLoading(false);
        return;
      }

      const url = `${creds.serverUrl}/rest/getRandomSongs.view?${params}&size=20`;
      const response = await fetch(url);
      const data = await response.json();

      const fetchedSongs: any[] =
        data["subsonic-response"]?.randomSongs?.song || [];

      const songsWithArt: Song[] = fetchedSongs.map((song) => {
        const artId = song.coverArt || song.id;
        const artworkUrl = `${creds.serverUrl}/rest/getCoverArt.view?${params}&id=${artId}&size=300`;

        return {
          id: song.id,
          title: song.title,
          artist: song.artist,
          album: song.album,
          duration: song.duration,
          artworkUrl: artworkUrl,
        };
      });

      setSongs(songsWithArt);
    } catch (error) {
      console.error("Failed fetching tracks:", error);
    } finally {
      setLoading(false);
    }
  }

  async function playSong(song: Song) {
    try {
      const creds = await authStorage.getCredentials();
      const params = await getSubsonicAuthParams();
      if (!creds || !params) return;

      if (currentSong?.id === song.id) {
        togglePlayPause();
        return;
      }

      const nextStreamUrl = `${creds.serverUrl}/rest/stream.view?${params}&id=${song.id}`;
      playNewSong(song, nextStreamUrl);
    } catch (error) {
      console.error("Error initiating stream via context:", error);
    }
  }

  const renderSongItem = ({ item }: { item: Song }) => {
    const isCurrent = item.id === currentSong?.id;
    const isPlaying = isCurrent && playing;

    return (
      <TouchableOpacity
        style={[styles.songCard, isCurrent && styles.activeSongCard]}
        onPress={() => playSong(item)}
      >
        <Image
          source={{ uri: item.artworkUrl }}
          style={styles.albumArt}
          contentFit="cover"
          transition={200}
          placeholder={require("../../assets/images/icon.png")}
        />
        <View style={styles.songInfo}>
          <Text
            style={[styles.title, isCurrent && styles.activeText]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {item.artist} {item.album ? `• ${item.album}` : ""}
          </Text>
        </View>
        <Text style={styles.playStatus}>
          {isPlaying ? "⏸ Pause" : isCurrent ? "▶ Resume" : "▶ Play"}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Dashboard Feed</Text>
      {songs.length === 0 ? (
        <Text style={styles.emptyText}>
          No music found or credentials missing.
        </Text>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id}
          renderItem={renderSongItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
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
    marginBottom: 20,
  },
  listContainer: {
    paddingBottom: 40,
  },
  songCard: {
    backgroundColor: "#1e1e1e",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeSongCard: {
    backgroundColor: "#282828",
    borderColor: "#1DB954",
    borderWidth: 1,
  },
  albumArt: {
    width: 50,
    height: 50,
    borderRadius: 4,
    backgroundColor: "#333",
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  } as TextStyle,
  activeText: {
    color: "#1DB954",
  } as TextStyle,
  artist: {
    color: "#b3b3b3",
    fontSize: 14,
  },
  playStatus: {
    color: "#1DB954",
    fontWeight: "bold",
    fontSize: 14,
  },
  emptyText: {
    color: "#b3b3b3",
    textAlign: "center",
    marginTop: 40,
  },
});
