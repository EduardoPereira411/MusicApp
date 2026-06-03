import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { Song } from "@/Models/Models";
import {
  fetchNavidromePlaylists,
  checkSongInPlaylist,
  addTrackToPlaylist,
} from "@/Services/navidromeService";
import { useRouter } from "expo-router";

interface SongOptionsModalProps {
  visible: boolean;
  song: Song | null;
  onClose: () => void;
  onAddToQueue: (song: Song) => void;
}

export function SongOptionsModal({
  visible,
  song,
  onClose,
  onAddToQueue,
}: SongOptionsModalProps) {
  const router = useRouter();
  const [viewState, setViewState] = useState<"menu" | "playlists">("menu");
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);

  // Reset view state whenever modal opens/closes
  useEffect(() => {
    if (visible) setViewState("menu");
  }, [visible]);

  if (!song) return null;

  const handleGoToAlbum = () => {
    if (!song.albumId) return;

    onClose();
    router.push({
      pathname: "/playlist",
      params: {
        id: song.albumId,
        type: "album",
        name: song.album || "Album",
      },
    });
  };

  const handlePlaylistSelectClick = async () => {
    setViewState("playlists");
    setLoadingPlaylists(true);
    try {
      const list = await fetchNavidromePlaylists();
      setPlaylists(list);
    } catch (e) {
      Alert.alert("Error", "Could not fetch playlists from the server.");
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const executeAddProcess = async (
    playlistId: string,
    playlistName: string,
  ) => {
    try {
      const success = await addTrackToPlaylist(playlistId, song.id);
      if (success) {
        Alert.alert("Success", `Added "${song.title}" to "${playlistName}".`);
        onClose();
      } else {
        Alert.alert("Error", "Could not update playlist on the server.");
      }
    } catch (e) {
      Alert.alert("Error", "An error occurred while adding the track.");
    }
  };

  const handleAddToPlaylistPress = async (
    playlistId: string,
    playlistName: string,
  ) => {
    try {
      const isAlreadyInPlaylist = await checkSongInPlaylist(
        playlistId,
        song.id,
      );

      if (isAlreadyInPlaylist) {
        Alert.alert(
          "Already in Playlist",
          `"${song.title}" is already in "${playlistName}". Do you want to add it anyway?`,
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Add Anyway",
              onPress: async () => {
                await executeAddProcess(playlistId, playlistName);
              },
            },
          ],
        );
        return;
      }

      await executeAddProcess(playlistId, playlistName);
    } catch (e) {
      Alert.alert("Error", "Could not verify playlist status.");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheetContainer}>
        <View style={styles.songHeader}>
          <Image
            source={{ uri: song.artworkUrl }}
            style={styles.metaArt}
            contentFit="cover"
          />
          <View style={styles.metaTextContainer}>
            <Text style={styles.metaTitle} numberOfLines={1}>
              {song.title}
            </Text>
            <Text style={styles.metaArtist} numberOfLines={1}>
              {song.artist}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {viewState === "menu" && (
          <View>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => {
                onAddToQueue(song);
                onClose();
              }}
            >
              <Text style={styles.optionText}>➕ Add to Queue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionRow}
              onPress={handlePlaylistSelectClick}
            >
              <Text style={styles.optionText}>
                🎵 Add to Navidrome Playlist
              </Text>
            </TouchableOpacity>

            {song.albumId && (
              <TouchableOpacity
                style={styles.optionRow}
                onPress={handleGoToAlbum}
              >
                <Text style={styles.optionText}>💿 Go to Album</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.optionRow, styles.cancelRow]}
              onPress={onClose}
            >
              <Text style={[styles.optionText, styles.cancelText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {viewState === "playlists" && (
          <View style={styles.playlistWrapper}>
            <View style={styles.subHeaderRow}>
              <TouchableOpacity
                onPress={() => setViewState("menu")}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>⬅ Back</Text>
              </TouchableOpacity>
              <Text style={styles.subHeaderTitle}>Select Playlist</Text>
            </View>

            {loadingPlaylists ? (
              <ActivityIndicator
                size="small"
                color="#1DB954"
                style={{ marginVertical: 20 }}
              />
            ) : playlists.length === 0 ? (
              <Text style={styles.emptyText}>
                No Navidrome playlists found.
              </Text>
            ) : (
              <FlatList
                data={playlists}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 250 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => handleAddToPlaylistPress(item.id, item.name)}
                  >
                    <Text style={styles.optionText}>📁 {item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1e1e1e",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  songHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  metaArt: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 14,
  },
  metaTextContainer: {
    flex: 1,
  },
  metaTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  metaArtist: {
    color: "#b3b3b3",
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#333",
    marginVertical: 10,
  },
  optionRow: {
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  optionText: {
    color: "#fff",
    fontSize: 16,
  },
  cancelRow: {
    marginTop: 10,
    justifyContent: "center",
    backgroundColor: "#282828",
    borderRadius: 8,
  },
  cancelText: {
    color: "#b3b3b3",
    fontWeight: "600",
  },
  playlistWrapper: {
    minHeight: 150,
  },
  subHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  backButton: {
    paddingRight: 16,
    paddingVertical: 5,
  },
  backButtonText: {
    color: "#1DB954",
    fontSize: 14,
    fontWeight: "600",
  },
  subHeaderTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyText: {
    color: "#b3b3b3",
    textAlign: "center",
    marginVertical: 20,
  },
});
