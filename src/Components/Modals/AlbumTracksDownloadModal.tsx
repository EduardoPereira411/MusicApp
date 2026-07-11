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
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { DownloadSongItem } from "@/Components/ItemDisplays/DownloadSongItem";
import { downloadService } from "@/Services/downloadService";
import { useDownloadAuth } from "@/Context/DownloadContext";
import { ArtworkImage } from "@/Components/ItemDisplays/ArtworkImage";
import { useUiStore } from "@/Stores/useUIStore";
import { DownloadTrackMetadata, SimpleTrackMetadata } from "@/Models/Models";

const MODAL_ID = "album-tracks-modal";

export function AlbumTracksDownloadModal() {
  const insets = useSafeAreaInsets();
  const { downloadCreds } = useDownloadAuth();

  const isVisible = useUiStore((state) => !!state.modals[MODAL_ID]);
  const modalPayload = useUiStore((state) => state.modalData[MODAL_ID]);
  const closeModal = useUiStore((state) => state.closeModal);

  const albumId = modalPayload?.albumId;
  const albumTitle = modalPayload?.albumTitle || "";

  const [tracks, setTracks] = useState<DownloadTrackMetadata[]>([]);
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
      const data = await downloadService.getAlbumTracks(downloadCreds, albumId);

      if (data && data.results && data.results[0]) {
        const structuralDetails = data.results[0];
        const albumCover = structuralDetails.album_cover || "";
        const releaseYear = structuralDetails.release || "1900";
        const artistName = Array.isArray(structuralDetails.artists)
          ? structuralDetails.artists.join(", ")
          : "";

        setAlbumMeta({ coverArt: albumCover, artist: artistName });

        const rawTracks: SimpleTrackMetadata[] =
          structuralDetails.results || [];

        const enrichedTracks: DownloadTrackMetadata[] = rawTracks.map(
          (track) => ({
            song_name: track.song_name,
            video_id: track.video_id,
            song_duration: track.song_duration,
            track_number: track.track_number,
            is_explicit: track.is_explicit,
            isrc: track.isrc,
            album_cover: albumCover,
            release: releaseYear,
            artists: Array.isArray(structuralDetails.artists)
              ? structuralDetails.artists
              : [artistName],
            album_name: structuralDetails.album_name || albumTitle,
            album_id: albumId,
          }),
        );

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
    try {
      const response = await downloadService.downloadAlbum(
        downloadCreds,
        albumId,
      );
      if (response && response.status === "accepted") {
        Alert.alert(
          "Success",
          `All tracks added to download queue! Task ID: ${response.task_id}`,
        );
      } else {
        Alert.alert("Error", "Failed executing bulk downloads.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Bulk action failure.");
    } finally {
      setBulkDownloading(false);
    }
  };

  const handleOpenAlbumInYTMusic = () => {
    if (!albumId) {
      Alert.alert("Error", "No album ID found for this context.");
      return;
    }

    Alert.alert(
      "Open in YouTube Music",
      `Would you like to open "${albumTitle}" on YouTube Music?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            const url = `https://music.youtube.com/browse/${albumId}`;
            try {
              await Linking.openURL(url);
            } catch (error) {
              Alert.alert(
                "Error",
                "An error occurred trying to open the app or browser.",
              );
            }
          },
        },
      ],
    );
  };

  const handleClose = () => {
    closeModal(MODAL_ID);
  };

  const renderItem = useCallback(
    ({ item, index }: { item: DownloadTrackMetadata; index: number }) => {
      return (
        <DownloadSongItem
          item={item}
          index={index}
          showTrackNumber={true}
          getLyricsOnDownload={true}
        />
      );
    },
    [],
  );

  const keyExtractor = useCallback((item: DownloadTrackMetadata) => {
    return item.video_id;
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
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.actionButtonText} numberOfLines={1}>
                  Download All
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryActionButton]}
            onPress={handleOpenAlbumInYTMusic}
          >
            <Ionicons
              name="open-outline"
              size={18}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.actionButtonText} numberOfLines={1}>
              YT Music
            </Text>
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
            <ActivityIndicator size="large" color="#00A3FF" />
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
  // 4. Clean side-by-side flex layout configurations
  actionButtonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    gap: 12, // Spaces the buttons evenly without breaking layout
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    flex: 1, // Ensures buttons share available room equally
  },
  downloadMainButton: {
    backgroundColor: "#00A3FF",
  },
  secondaryActionButton: {
    backgroundColor: "#242424",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
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
