import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ScaleDecorator } from "react-native-draggable-flatlist";
import { Song } from "@/Models/Models";

interface QueueTrackProps {
  item: Song & { absoluteIndex: number };
  drag: () => void;
  isActive: boolean;
  onTrackPress: (index: number) => void;
  onRemovePress: (index: number) => void;
}

export const QueueTrack = React.memo(function QueueTrack({
  item,
  drag,
  isActive,
  onTrackPress,
  onRemovePress,
}: QueueTrackProps) {
  return (
    <ScaleDecorator>
      <View style={[styles.trackRow, isActive && styles.activeDragRow]}>
        <TouchableOpacity
          onLongPress={drag}
          delayLongPress={100}
          style={styles.dragHandle}
        >
          <Ionicons name="menu" size={20} color="#555" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.trackDetails}
          onPress={() => onTrackPress(item.absoluteIndex)}
        >
          {item.artworkUrl ? (
            <Image source={{ uri: item.artworkUrl }} style={styles.artwork} />
          ) : (
            <View style={[styles.artwork, styles.fallbackArtwork]} />
          )}
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {item.artist}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => onRemovePress(item.absoluteIndex)}
        >
          <Ionicons name="trash-outline" size={20} color="#ff4d4d" />
        </TouchableOpacity>
      </View>
    </ScaleDecorator>
  );
});

const styles = StyleSheet.create({
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  activeDragRow: {
    backgroundColor: "#333333",
    opacity: 0.9,
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
