import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { AlbumTracksModal } from "@/Components/AlbumTracksModal";
import { downloadService } from "@/Services/downloadService";
import { DownloadAlbumMetadata } from "@/Models/Models";

interface DownloadAlbumItemProps {
  item: DownloadAlbumMetadata;
}

export function DownloadAlbumItem({ item }: DownloadAlbumItemProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const displayTitle = item.album_name || (item as any).title;
  const displayId = item.album_id || (item as any).browseId;

  const handleDownloadFullAlbum = async () => {
    setIsDownloadingAll(true);
    const response = await downloadService.getAlbumTracks(displayId, true);

    if (response) {
      Alert.alert("Success", `Queued full album download!`);
    } else {
      Alert.alert("Error", "Failed to queue album download.");
    }
    setIsDownloadingAll(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
      >
        <Image
          source={
            item.album_cover
              ? { uri: item.album_cover }
              : require("@/assets/images/icon.png")
          }
          style={styles.coverArt}
        />
        <View style={styles.textContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {displayTitle}
          </Text>
          <Text style={styles.details} numberOfLines={1}>
            {item.album_type || "Album"} • {item.artist}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.getButton, isDownloadingAll && styles.disabledButton]}
          onPress={handleDownloadFullAlbum}
          disabled={isDownloadingAll}
        >
          {isDownloadingAll ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.getButtonText}>Get</Text>
          )}
        </TouchableOpacity>
      </TouchableOpacity>

      <AlbumTracksModal
        visible={modalVisible}
        albumId={displayId}
        albumTitle={displayTitle}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#121212",
  },
  coverArt: {
    width: 64,
    height: 64,
    borderRadius: 6,
    backgroundColor: "#282828",
  },
  textContainer: { flex: 1, marginLeft: 14, justifyContent: "center" },
  name: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 4 },
  details: { color: "#b3b3b3", fontSize: 13 },
  getButton: {
    backgroundColor: "#00A3FF",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 60,
    alignItems: "center",
  },
  disabledButton: { backgroundColor: "#333" },
  getButtonText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
});
