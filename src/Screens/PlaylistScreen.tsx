import React, { useState, useEffect, useCallback } from "react";
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
import { fetchPlaylistOrAlbumDetails } from "@/Services/navidromeService";
import { useAudio } from "@/Context/AudioContext";
import { Song } from "@/Models/Models";
import { SongItem } from "@/Components/SongItem";
import { SongOptionsModal } from "@/Components/SongOptionsModal";

export default function PlaylistScreen() {
  const router = useRouter();
  // Consume parameters passed by router
  const { id, type, name } = useLocalSearchParams<{
    id: string;
    type: "playlist" | "album";
    name: string;
  }>();

  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);

  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const { currentSong, playing, playSongNow, addToQueue } = useAudio();

  useEffect(() => {
    if (id && type) {
      fetchDetails();
    }
  }, [id, type]);

  async function fetchDetails() {
    if (!id || !type) return;

    setLoading(true);
    try {
      const mappedSongs = await fetchPlaylistOrAlbumDetails(id, type, name);
      setSongs(mappedSongs);
    } catch (error) {
      console.error(
        `[PlaylistScreen] UI Error rendering ${type} details:`,
        error,
      );
    } finally {
      setLoading(false);
    }
  }

  const handleSongOptions = useCallback((song: Song) => {
    setSelectedSong(song);
    setIsModalVisible(true);
  }, []);

  const handlePlaySong = useCallback(
    (item: Song) => {
      if (isShuffle) {
        const contextCopy = songs.filter((s) => s.id !== item.id);
        for (let i = contextCopy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [contextCopy[i], contextCopy[j]] = [contextCopy[j], contextCopy[i]];
        }
        playSongNow(item, [item, ...contextCopy]);
      } else {
        playSongNow(item, songs);
      }
    },
    [isShuffle, songs, playSongNow],
  );

  const renderSongItem = useCallback(
    ({ item, index }: { item: Song; index: number }) => {
      const isCurrent = currentSong?.id === item.id;
      return (
        <SongItem
          item={item}
          index={index}
          showTrackNumber={true}
          isCurrent={isCurrent}
          isPlaying={isCurrent && playing}
          onOptionsPress={handleSongOptions}
          onSwipeLeftToRight={addToQueue}
          onPlay={handlePlaySong}
        />
      );
    },
    [currentSong?.id, playing, handleSongOptions, addToQueue, handlePlaySong],
  );

  const keyExtractor = useCallback(
    (item: Song, index: number) => `${item.id}-${index}`,
    [],
  );

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
        <TouchableOpacity
          style={styles.shuffleButton}
          onPress={() => setIsShuffle(!isShuffle)}
        >
          <Ionicons
            name="shuffle"
            size={24}
            color={isShuffle ? "#1DB954" : "#fff"}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={songs}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContainer}
        renderItem={renderSongItem}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            This context contains no playable items.
          </Text>
        }
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
  shuffleButton: {
    padding: 8,
    marginLeft: 8,
  },
  listContainer: {
    paddingBottom: 200,
  },
  emptyText: {
    color: "#b3b3b3",
    textAlign: "center",
    marginTop: 40,
  },
});
