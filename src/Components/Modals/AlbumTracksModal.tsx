import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { DownloadSongItem } from "@/Components/ItemDisplays/DownloadSongItem";
import { downloadService } from "@/Services/downloadService";
import { useDownloadAuth } from "@/Context/DownloadContext";
import { ArtworkImage } from "@/Components/ItemDisplays/ArtworkImage";
import { useUiStore } from "@/Stores/useUIStore";

const MODAL_ID = "album-tracks-modal";

export function AlbumTracksModal() {
  const insets = useSafeAreaInsets();
  const { downloadCreds } = useDownloadAuth();

  const isVisible = useUiStore((state) => !!state.modals[MODAL_ID]);
  const modalPayload = useUiStore((state) => state.modalData[MODAL_ID]);
  const closeModal = useUiStore((state) => state.closeModal);

  const albumId = modalPayload?.albumId;
  const albumTitle = modalPayload?.albumTitle || "";

  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [albumMeta, setAlbumMeta] = useState({ coverArt: "", artist: "" });

  useEffect(() => {
    if (isVisible && albumId) {
      fetchAlbumDetails();
    } else if (!isVisible) {
      setTracks([]);
      setAlbumMeta({ coverArt: "", artist: "" });
    }
  }, [isVisible, albumId]);

  const fetchAlbumDetails = async () => {
    if (!downloadCreds) {
      Alert.alert("Error", "Missing download configuration credentials.");
      return;
    }

    setLoading(true);
    try {
      const data = await downloadService.getAlbumTracks(
        downloadCreds,
        albumId,
        false,
      );

      if (data && data.results) {
        const albumCover = data.album_cover || "";
        const releaseYear = data.release || "1900";
        const artistName = data.artist || "";

        setAlbumMeta({ coverArt: albumCover, artist: artistName });

        const enrichedTracks = data.results.map((track: any) => ({
          ...track,
          album_cover: albumCover,
          release: releaseYear,
          artist: artistName,
          album_name: data.album_name || albumTitle,
        }));

        setTracks(enrichedTracks);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load album tracks.");
    } finally {
      setLoading(false);
    }
  };

  const downloadAllTracks = async () => {
    if (!downloadCreds || !albumId) return;

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

  const handleClose = () => {
    closeModal(MODAL_ID);
  };

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      return (
        <DownloadSongItem item={item} index={index} showTrackNumber={true} />
      );
    },
    [],
  );

  const keyExtractor = useCallback((item: any, index: number) => {
    return item.download_url || index.toString();
  }, []);

  const renderListHeader = useMemo(() => {
    if (tracks.length === 0) return null;

    return (
      <View style={styles.headerBlock}>
        <View style={styles.artworkWrapper}>
          <ArtworkImage
            coverArtId={albumMeta.coverArt}
            size={160}
            type="album"
            fallbackName={albumTitle}
            style={styles.heroArtwork}
            isDownloadSource={true}
          />
        </View>

        <Text style={styles.contentTypeLabel}>ALBUM COLLECTION</Text>
        <Text style={styles.headerTitle} numberOfLines={2}>
          {albumTitle || "Details"}
        </Text>
        {albumMeta.artist ? (
          <Text style={styles.artistLabel}>{albumMeta.artist}</Text>
        ) : null}

        <Text style={styles.headerSubtitle}>
          {tracks.length} Tracks Available for Download
        </Text>

        <View style={styles.actionButtonGroup}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.downloadMainButton,
              bulkDownloading && styles.bulkDisabled,
            ]}
            onPress={downloadAllTracks}
            disabled={bulkDownloading}
          >
            {bulkDownloading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="cloud-download"
                  size={18}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.actionButtonText}>Download All Songs</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [tracks, albumMeta, albumTitle, bulkDownloading]);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View
          style={[styles.headerRow, { paddingTop: Math.max(insets.top, 12) }]}
        >
          <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
            <Ionicons name="chevron-down" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerRowTitle}>Collection Options</Text>
          <View style={{ width: 36 }} />
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#1DB954" />
          </View>
        ) : (
          <FlatList
            data={tracks}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.listContainer,
              { paddingBottom: insets.bottom + 40 },
            ]}
            ListHeaderComponent={renderListHeader}
            initialNumToRender={10}
            maxToRenderPerBatch={8}
            windowSize={3}
            removeClippedSubviews={true}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              !loading && (
                <Text style={styles.emptyText}>
                  No downloadable tracks found in this context.
                </Text>
              )
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#121212",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#121212",
    zIndex: 10,
  },
  headerRowTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  iconButton: {
    padding: 4,
  },
  headerBlock: {
    alignItems: "center",
    paddingTop: 16,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  artworkWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 12,
    marginBottom: 18,
  },
  heroArtwork: {
    width: 160,
    height: 160,
    borderRadius: 8,
    backgroundColor: "#282828",
  },
  contentTypeLabel: {
    color: "#00A3FF",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  artistLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    opacity: 0.9,
    marginBottom: 4,
  },
  headerSubtitle: {
    color: "#b3b3b3",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 16,
  },
  actionButtonGroup: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    paddingHorizontal: 32,
    borderRadius: 22,
    maxWidth: 280,
    flex: 1,
  },
  downloadMainButton: {
    backgroundColor: "#00A3FF",
  },
  bulkDisabled: {
    backgroundColor: "#333",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  emptyText: {
    color: "#b3b3b3",
    textAlign: "center",
    marginTop: 60,
  },
});
