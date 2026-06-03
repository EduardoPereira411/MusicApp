import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Song } from "@/Models/Models";

interface SongItemProps {
  item: Song;
  isCurrent: boolean;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
  onOptionsPress: (song: Song) => void;
  showTrackNumber?: boolean;
  index?: number;
}

export const SongItem = React.memo(
  ({
    item,
    isCurrent,
    isPlaying,
    onPlay,
    onOptionsPress,
    showTrackNumber = false,
    index,
  }: SongItemProps) => {
    const displayTrackNumber =
      item.trackNumber ?? (index !== undefined ? index + 1 : null);

    return (
      <View style={[styles.itemCard, isCurrent && styles.activeCard]}>
        <TouchableOpacity
          style={styles.touchableArea}
          onPress={() => onPlay(item)}
        >
          {showTrackNumber && displayTrackNumber !== null ? (
            <Text
              style={[styles.trackNumberText, isCurrent && styles.activeText]}
            >
              {displayTrackNumber}
            </Text>
          ) : null}

          <Image
            source={{ uri: item.artworkUrl }}
            style={styles.cardArt}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.infoContainer}>
            <Text
              style={[styles.mainText, isCurrent && styles.activeText]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text style={styles.subText} numberOfLines={1}>
              {item.artist} {item.album ? `• ${item.album}` : ""}
            </Text>
          </View>
          <Text style={styles.actionStatus}>{isPlaying ? "⏸" : "▶"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionsButton}
          onPress={() => onOptionsPress(item)}
        >
          <Text style={styles.optionsText}>⋮</Text>
        </TouchableOpacity>
      </View>
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
  },
  activeCard: {
    backgroundColor: "#282828",
    borderColor: "#1DB954",
    borderWidth: 1,
  },
  touchableArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  cardArt: {
    width: 55,
    height: 55,
    borderRadius: 6,
    backgroundColor: "#333",
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
  activeText: {
    color: "#1DB954",
  },
  subText: {
    color: "#b3b3b3",
    fontSize: 13,
  },
  actionStatus: {
    color: "#1DB954",
    fontSize: 18,
    paddingHorizontal: 8,
  },
  optionsButton: {
    paddingLeft: 16,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  optionsText: {
    color: "#b3b3b3",
    fontSize: 22,
    fontWeight: "bold",
  },
  trackNumberText: {
    color: "#b3b3b3",
    fontSize: 14,
    width: 28,
    textAlign: "center",
    marginRight: 8,
  },
});
