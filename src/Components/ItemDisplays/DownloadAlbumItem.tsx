import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { downloadService } from "@/Services/downloadService";
import { DownloadAlbumMetadata } from "@/Models/Models";
import { useDownloadAuth } from "@/Context/DownloadContext";
import { useUiStore } from "@/Stores/useUIStore";

interface DownloadAlbumItemProps {
  item: DownloadAlbumMetadata;
}

export const DownloadAlbumItem = React.memo(
  ({ item }: DownloadAlbumItemProps) => {
    const { downloadCreds } = useDownloadAuth();

    const openModal = useUiStore((state) => state.openModal);

    const handlePress = React.useCallback(() => {
      openModal("album-tracks-modal", {
        albumId: item.album_id,
        albumTitle: item.album_name,
      });
    }, [item.album_id, item.album_name]);
    const [isDownloadingAll, setIsDownloadingAll] = useState(false);

    const displayTitle = item.album_name || (item as any).title;
    const displayId = item.album_id || (item as any).browseId;
    const artworkUrl = item.album_cover || "";

    const handleDownloadFullAlbum = async () => {
      if (!downloadCreds) {
        Alert.alert("Error", "Missing download configuration credentials.");
        return;
      }

      setIsDownloadingAll(true);

      const response = await downloadService.getAlbumTracks(
        downloadCreds,
        displayId,
        true,
      );

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
          style={styles.itemCard}
          activeOpacity={0.8}
          onPress={handlePress}
        >
          <Image
            source={
              artworkUrl
                ? { uri: artworkUrl }
                : require("@/assets/images/icon.png")
            }
            style={styles.cardArt}
            contentFit="cover"
            transition={200}
            recyclingKey={artworkUrl}
          />
          <View style={styles.infoContainer}>
            <Text style={styles.mainText} numberOfLines={1}>
              {displayTitle}
            </Text>
            <Text style={styles.subText} numberOfLines={1}>
              {item.album_type || "Album"} • {item.artist}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.downloadButton,
              isDownloadingAll && styles.disabledButton,
            ]}
            onPress={handleDownloadFullAlbum}
            disabled={isDownloadingAll}
          >
            {isDownloadingAll ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.downloadButtonText}>Get</Text>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </>
    );
  },
);

const styles = StyleSheet.create({
  itemCard: {
    backgroundColor: "#1e1e1e",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 163, 255, 0.15)",
  },
  cardArt: {
    width: 55,
    height: 55,
    borderRadius: 6,
    backgroundColor: "#282828",
    marginRight: 14,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  mainText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  subText: {
    color: "#b3b3b3",
    fontSize: 13,
  },
  downloadButton: {
    backgroundColor: "#00A3FF",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 60,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#333",
  },
  downloadButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
});
