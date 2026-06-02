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
} from "react-native";
import { Image } from "expo-image";
import { Song } from "./SongItem";

interface SongOptionsModalProps {
  visible: boolean;
  song: Song | null;
  onClose: () => void;
  onAddToQueue: (song: Song) => void;
  onGoToAlbum: (albumId: string) => void;
  fetchPlaylists: () => Promise<any[]>;
  onAddToPlaylist: (
    song: Song,
    playlistId: string,
    playlistName: string,
  ) => Promise<void>;
}

export function SongOptionsModal({
  visible,
  song,
  onClose,
  onAddToQueue,
  onGoToAlbum,
  fetchPlaylists,
  onAddToPlaylist,
}: SongOptionsModalProps) {
  const [viewState, setViewState] = useState<"menu" | "playlists">("menu");
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);

  // Reset view state whenever modal opens/closes
  useEffect(() => {
    if (visible) setViewState("menu");
  }, [visible]);

  if (!song) return null;

  const handlePlaylistSelectClick = async () => {
    setViewState("playlists");
    setLoadingPlaylists(true);
    const list = await fetchPlaylists();
    setPlaylists(list);
    setLoadingPlaylists(false);
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

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => {
                if (song.albumId) {
                  onGoToAlbum(song.albumId);
                  onClose();
                } else {
                  alert("Album ID not found for this track.");
                }
              }}
            >
              <Text style={styles.optionText}>💿 Go to Album</Text>
            </TouchableOpacity>

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
                    onPress={async () => {
                      await onAddToPlaylist(song, item.id, item.name);
                      onClose();
                    }}
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
