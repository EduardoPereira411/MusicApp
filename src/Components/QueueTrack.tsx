import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Song } from "@/Models/Models";

interface QueueTrackProps {
  item: Song & { absoluteIndex: number };
  onTrackPress: (index: number) => void;
  onRemovePress: (index: number) => void;
}

export const QueueTrack = React.memo(
  function QueueTrack({ item, onTrackPress, onRemovePress }: QueueTrackProps) {
    const { absoluteIndex, artworkUrl, title, artist } = item;

    return (
      <View style={styles.trackRow}>
        <View style={styles.dragHandle}>
          <Ionicons name="menu" size={20} color="#555" />
        </View>

        <TouchableOpacity
          style={styles.trackDetails}
          onPress={() => onTrackPress(absoluteIndex)}
        >
          {artworkUrl ? (
            <Image
              source={{ uri: artworkUrl }}
              style={styles.artwork}
              cachePolicy="disk"
            />
          ) : (
            <View style={[styles.artwork, styles.fallbackArtwork]} />
          )}
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {artist}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => onRemovePress(absoluteIndex)}
        >
          <Ionicons name="trash-outline" size={20} color="#ff4d4d" />
        </TouchableOpacity>
      </View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.absoluteIndex === nextProps.item.absoluteIndex &&
      prevProps.onTrackPress === nextProps.onTrackPress &&
      prevProps.onRemovePress === nextProps.onRemovePress
    );
  },
);

const styles = StyleSheet.create({
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginBottom: 8,
    height: 64,
  },
  dragHandle: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  trackDetails: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 4,
  },
  fallbackArtwork: {
    backgroundColor: "#333",
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  artist: {
    color: "#b3b3b3",
    fontSize: 12,
    marginTop: 2,
  },
  removeButton: {
    padding: 10,
  },
});
