import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  authStorage,
  getSubsonicAuthParams,
} from "../Services/navidromeService";
import { useAudio } from "../Context/AudioContext";
import { SongItem, Song } from "../Components/SongItem";
import { SongOptionsModal } from "../Components/SongOptionsModal";

export default function PlaylistScreen() {
  const router = useRouter();
  // Consume parameters passed by
  const { id, type, name } = useLocalSearchParams<{
    id: string;
    type: "playlist" | "album";
    name: string;
  }>();

  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const { currentSong, playing, playSongNow, addToQueue } = useAudio();

  useEffect(() => {
    if (id && type) {
      fetchDetails();
    }
  }, [id, type]);

  async function fetchDetails() {
    setLoading(true);
    try {
      const creds = await authStorage.getCredentials();
      const params = await getSubsonicAuthParams();
      if (!creds || !params) return;

      //dynamic endpoint if playlist or album
      const endpoint =
        type === "playlist" ? "getPlaylist.view" : "getAlbum.view";
      const url = `${creds.serverUrl}/rest/${endpoint}?${params}&id=${id}&f=json`;

      const response = await fetch(url);
      const data = await response.json();

      // Target the container block ('playlist' or 'album')
      const targetData =
        data["subsonic-response"]?.[type === "playlist" ? "playlist" : "album"];

      const rawTracks = targetData?.entry || targetData?.song || [];

      let tracksArray = [];
      if (rawTracks) {
        tracksArray = Array.isArray(rawTracks) ? rawTracks : [rawTracks];
      }

      // Filter out any blank or metadata-only objects that lack an ID
      tracksArray = tracksArray.filter((track: any) => track && track.id);
      const mappedSongs: Song[] = tracksArray.map((track: any) => ({
        id: track.id,
        title: track.title || "Unknown Title",
        artist: track.artist || "Unknown Artist",
        album: track.album || name || "",
        albumId: track.albumId || id,
        artworkUrl: `${creds.serverUrl}/rest/getCoverArt.view?${params}&id=${track.coverArt || track.id}&size=150`,
      }));

      setSongs(mappedSongs);
    } catch (error) {
      console.error(
        `[PlaylistScreen] Error fetching dynamic ${type} details:`,
        error,
      );
    } finally {
      setLoading(false);
    }
  }

  const handleSongOptions = (song: Song) => {
    setSelectedSong(song);
    setIsModalVisible(true);
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
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.contentTypeLabel}>
            {type === "playlist" ? "PLAYLIST" : "ALBUM"}
          </Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {name || "Details"}
          </Text>
        </View>
      </View>

      {/* Tracks Listing */}
      <FlatList
        data={songs}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            This context contains no playable items.
          </Text>
        }
        renderItem={({ item }) => {
          const isCurrent = currentSong?.id === item.id;
          return (
            <SongItem
              item={item}
              isCurrent={isCurrent}
              isPlaying={isCurrent && playing}
              onPlay={playSongNow}
              onOptionsPress={handleSongOptions}
            />
          );
        }}
      />

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
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  contentTypeLabel: {
    color: "#1DB954",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  listContainer: {
    paddingBottom: 130, // Pushes elements safely over the GlobalMiniPlayer bounding box layout
  },
  emptyText: {
    color: "#b3b3b3",
    textAlign: "center",
    marginTop: 40,
  },
});
