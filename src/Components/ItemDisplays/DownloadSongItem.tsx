import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { downloadService } from "@/Services/downloadService";
import { DownloadTrackMetadata } from "@/Models/Models";
import { useDownloadAuth } from "@/Context/DownloadContext";

interface DownloadSongItemProps {
  item: DownloadTrackMetadata & { artists?: string[]; artist?: string };
  index?: number;
  showTrackNumber?: boolean;
  autocompleteOnDownload?: boolean;
  getLyricsOnDownload?: boolean;
}

export const DownloadSongItem = React.memo(
  ({
    item,
    index,
    showTrackNumber = true,
    autocompleteOnDownload = false,
    getLyricsOnDownload = false,
  }: DownloadSongItemProps) => {
    const { downloadCreds } = useDownloadAuth();
    const [isDownloading, setIsDownloading] = React.useState(false);

    const handleDownload = async () => {
      if (!downloadCreds) {
        Alert.alert("Error", "Missing download configuration credentials.");
        return;
      }

      setIsDownloading(true);
      try {
        const response = await downloadService.downloadTrack(
          downloadCreds,
          item,
          autocompleteOnDownload,
          getLyricsOnDownload,
        );
        if (response && response.status === "accepted") {
          Alert.alert("Success", `Started downloading: ${item.song_name}`);
        } else {
          Alert.alert("Error", "Failed to queue download on server.");
        }
      } catch (error) {
        Alert.alert("Error", "An error occurred during download execution.");
      } finally {
        setIsDownloading(false);
      }
    };

    const handleOpenInYTMusic = () => {
      const videoId = item.video_id || (item as any).videoId;

      if (!videoId) {
        Alert.alert("Error", "No video ID found for this track.");
        return;
      }

      Alert.alert(
        "Open in YouTube Music",
        `Would you like to open "${item.song_name}" on YouTube Music?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Yes",
            onPress: async () => {
              const url = `https://music.youtube.com/watch?v=${videoId}`;
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

    const formatDuration = (seconds?: number) => {
      if (!seconds) return "";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    const artworkUrl = item.album_cover || "";

    const displayArtists = Array.isArray(item.artists)
      ? item.artists.join(", ")
      : item.artist || "Unknown Artist";

    return (
      <View style={styles.itemCard}>
        <TouchableOpacity
          style={styles.clickableArea}
          onPress={handleOpenInYTMusic}
          activeOpacity={0.7}
        >
          {showTrackNumber && typeof index === "number" ? (
            <Text style={styles.trackNumberText}>{index + 1}</Text>
          ) : (
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
          )}

          <View style={styles.infoContainer}>
            <Text style={styles.mainText} numberOfLines={1}>
              {item.song_name}
            </Text>
            <Text style={styles.subText} numberOfLines={1}>
              {displayArtists} {item.album_name ? `• ${item.album_name}` : ""}{" "}
              {item.song_duration
                ? `• ${formatDuration(item.song_duration)}`
                : ""}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.downloadButton,
            isDownloading && styles.disabledButton,
          ]}
          onPress={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.downloadButtonText}>Get</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  itemCard: {
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 163, 255, 0.08)",
    paddingRight: 14,
  },
  clickableArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingLeft: 14,
  },
  trackNumberText: {
    color: "#b3b3b3",
    fontSize: 14,
    width: 28,
    textAlign: "center",
    marginRight: 10,
    fontWeight: "500",
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
    marginLeft: 12,
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
