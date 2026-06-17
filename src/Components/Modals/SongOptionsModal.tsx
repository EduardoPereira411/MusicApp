import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { useToast } from "@/Context/ToastContext";
import { useAudioActions } from "@/Stores/useAudioStore";
import { useRouter } from "expo-router";
import { AddToPlaylistModal } from "@/Components/Modals/AddToPlaylistModal";
import { useUiStore } from "@/Stores/useUIStore";
import { ArtworkImage } from "@/Components/ItemDisplays/ArtworkImage";

export function SongOptionsModal() {
  const router = useRouter();
  const { showToast } = useToast();

  const visible = useUiStore((state) => !!state.modals["song-options"]);
  const song = useUiStore((state) => state.modalData["song-options"]);
  const closeModal = useUiStore((state) => state.closeModal);
  const onClose = () => closeModal("song-options");

  const { addToQueue: storeAddToQueue } = useAudioActions();
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);

  if (!visible || !song) return null;

  const handleGoToAlbum = () => {
    if (!song.albumId) return;
    onClose();
    router.push({
      pathname: "/playlist",
      params: { id: song.albumId, type: "album", name: song.album || "Album" },
    });
  };

  return (
    <>
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
            <ArtworkImage
              coverArtId={song.coverArt}
              size={100}
              type="track"
              style={styles.metaArt}
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

          <View>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => {
                storeAddToQueue(song, showToast);
                onClose();
              }}
            >
              <Text style={styles.optionText}>➕ Add to Queue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setPlaylistModalVisible(true)}
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
        </View>
      </Modal>

      <AddToPlaylistModal
        visible={playlistModalVisible}
        onClose={() => setPlaylistModalVisible(false)}
        song={song}
      />
    </>
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
});
