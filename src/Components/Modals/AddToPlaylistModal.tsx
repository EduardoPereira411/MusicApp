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
import { useAuth } from "@/Context/AuthContext";
import {
  fetchNavidromePlaylists,
  checkSongInPlaylist,
  addTrackToPlaylist,
} from "@/Services/navidromeService";

interface AddToPlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  song: { id: string; title: string } | null;
}

export function AddToPlaylistModal({
  visible,
  onClose,
  song,
}: AddToPlaylistModalProps) {
  const { navidromeCreds } = useAuth();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && navidromeCreds) {
      loadPlaylists();
    }
  }, [visible]);

  const loadPlaylists = async () => {
    if (!navidromeCreds) {
      Alert.alert("Error", "You must be logged in to manage playlists.");
      return;
    }
    setLoading(true);
    try {
      const list = await fetchNavidromePlaylists(navidromeCreds);
      setPlaylists(list);
    } catch (e) {
      Alert.alert("Error", "Could not fetch playlists from the server.");
    } finally {
      setLoading(false);
    }
  };

  const executeAddProcess = async (
    playlistId: string,
    playlistName: string,
  ) => {
    if (!navidromeCreds || !song) return;
    try {
      const success = await addTrackToPlaylist(
        navidromeCreds,
        playlistId,
        song.id,
      );
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
    if (!navidromeCreds || !song) return;
    try {
      const isAlreadyInPlaylist = await checkSongInPlaylist(
        navidromeCreds,
        playlistId,
        song.id,
      );
      if (isAlreadyInPlaylist) {
        Alert.alert(
          "Already in Playlist",
          `"${song.title}" is already in "${playlistName}". Add anyway?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Add Anyway",
              onPress: () => executeAddProcess(playlistId, playlistName),
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

  if (!visible || !song) return null;

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
        <Text style={styles.headerTitle}>Select Playlist</Text>
        <View style={styles.divider} />

        {loading ? (
          <ActivityIndicator
            size="small"
            color="#1DB954"
            style={{ marginVertical: 20 }}
          />
        ) : playlists.length === 0 ? (
          <Text style={styles.emptyText}>No Navidrome playlists found.</Text>
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
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
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
    paddingTop: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  divider: { height: 1, backgroundColor: "#333", marginVertical: 15 },
  optionRow: { paddingVertical: 16 },
  optionText: { color: "#fff", fontSize: 16 },
  emptyText: { color: "#b3b3b3", textAlign: "center", marginVertical: 20 },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 14,
    backgroundColor: "#282828",
    borderRadius: 8,
    alignItems: "center",
  },
  cancelText: { color: "#b3b3b3", fontWeight: "600", fontSize: 16 },
});
