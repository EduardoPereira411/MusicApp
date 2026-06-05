import { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DownloadSongItem } from "@/Components/DownloadSongItem";
import { downloadService } from "@/Services/downloadService";
import { useAuth } from "@/Context/AuthContext";

interface AlbumTracksModalProps {
  visible: boolean;
  albumId: string;
  albumTitle: string;
  onClose: () => void;
}

export function AlbumTracksModal({
  visible,
  albumId,
  albumTitle,
  onClose,
}: AlbumTracksModalProps) {
  const { downloadCreds } = useAuth();

  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkDownloading, setBulkDownloading] = useState(false);

  useEffect(() => {
    if (visible && albumId) {
      fetchAlbumDetails();
    }
  }, [visible, albumId]);

  const fetchAlbumDetails = async () => {
    // Safety check: ensure credentials are present
    if (!downloadCreds) {
      Alert.alert("Error", "Missing download configuration credentials.");
      return;
    }

    setLoading(true);
    const data = await downloadService.getAlbumTracks(
      downloadCreds,
      albumId,
      false,
    );

    if (data && data.results) {
      const albumCover = data.album_cover || "";
      const releaseYear = data.release || "1900";

      const enrichedTracks = data.results.map((track: any) => ({
        ...track,
        album_cover: albumCover,
        release: releaseYear,
        artist: data.artist || "",
        album_name: data.album_name || albumTitle,
      }));

      setTracks(enrichedTracks);
    }
    setLoading(false);
  };

  const downloadAllTracks = async () => {
    if (!downloadCreds) return;

    setBulkDownloading(true);
    const data = await downloadService.getAlbumTracks(
      downloadCreds,
      albumId,
      true,
    );
    if (data) {
      Alert.alert("Success", "All tracks added to the download queue!");
    } else {
      Alert.alert("Error", "Failed executing bulk downloads.");
    }
    setBulkDownloading(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer} edges={["top"]}>
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.title} numberOfLines={1}>
              {albumTitle}
            </Text>
            <Text style={styles.subtitle}>Tracks available for collection</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#00A3FF" />
          </View>
        ) : (
          <FlatList
            data={tracks}
            keyExtractor={(item, index) =>
              item.download_url || index.toString()
            }
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              tracks.length > 0 ? (
                <TouchableOpacity
                  style={[
                    styles.bulkButton,
                    bulkDownloading && styles.bulkDisabled,
                  ]}
                  onPress={downloadAllTracks}
                  disabled={bulkDownloading}
                >
                  {bulkDownloading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.bulkButtonText}>
                      Download All Songs
                    </Text>
                  )}
                </TouchableOpacity>
              ) : null
            }
            renderItem={({ item }) => <DownloadSongItem item={item} />}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: "#121212" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#222",
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  subtitle: { color: "#666", fontSize: 13, marginTop: 2 },
  closeButton: {
    backgroundColor: "#282828",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  closeText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  bulkButton: {
    backgroundColor: "#1DB954",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 12,
  },
  bulkDisabled: { backgroundColor: "#333" },
  bulkButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});
