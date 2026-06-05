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
import { downloadService } from "@/Services/downloadService";
import { DownloadTrackMetadata } from "@/Models/Models";
import { useAuth } from "@/Context/AuthContext";

interface DownloadSongItemProps {
  item: DownloadTrackMetadata;
}

export function DownloadSongItem({ item }: DownloadSongItemProps) {
  const { downloadCreds } = useAuth();

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!downloadCreds) {
      Alert.alert("Error", "Missing download configuration credentials.");
      return;
    }

    setIsDownloading(true);
    try {
      const response = await downloadService.downloadTrack(downloadCreds, item);
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

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <View style={styles.container}>
      <Image
        source={
          item.album_cover
            ? { uri: item.album_cover }
            : require("@/assets/images/icon.png")
        }
        style={styles.coverArt}
      />
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {item.song_name}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {item.artist} {item.album_name ? `• ${item.album_name}` : ""}
        </Text>
        {item.song_duration ? (
          <Text style={styles.durationText}>
            {formatDuration(item.song_duration)}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity
        style={[styles.button, isDownloading && styles.buttonDisabled]}
        onPress={handleDownload}
        disabled={isDownloading}
      >
        {isDownloading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Get</Text>
        )}
      </TouchableOpacity>
    </View>
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
    width: 50,
    height: 50,
    borderRadius: 4,
    backgroundColor: "#282828",
  },
  textContainer: { flex: 1, marginLeft: 14, justifyContent: "center" },
  title: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 2 },
  subtitle: { color: "#b3b3b3", fontSize: 13, marginBottom: 2 },
  durationText: { color: "#666", fontSize: 11 },
  button: {
    backgroundColor: "#00A3FF",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 60,
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#333" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
});
