import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAudioActions } from "@/Stores/useAudioStore";
import { QueueSong } from "@/Models/Models";
import { ArtworkImage } from "@/Components/ItemDisplays/ArtworkImage";

interface QueueTrackProps {
  item: QueueSong;
}

export const QueueTrack = React.memo(
  function QueueTrack({ item }: QueueTrackProps) {
    const { clientQueueId, coverArt, title, artist, origin } = item;
    const { skipToSongOnQueue, removeFromQueue, promoteAutoTrackToUser } =
      useAudioActions();

    const handleTrackPress = useCallback(
      () => skipToSongOnQueue(clientQueueId),
      [clientQueueId, skipToSongOnQueue],
    );
    const handleRemovePress = useCallback(
      () => removeFromQueue(clientQueueId),
      [clientQueueId, removeFromQueue],
    );
    const handleAddToUserQueue = useCallback(
      () => promoteAutoTrackToUser(clientQueueId),
      [clientQueueId, promoteAutoTrackToUser],
    );

    return (
      <View style={styles.trackRow}>
        <View style={styles.dragHandle}>
          <Ionicons name="menu" size={20} color="#555" />
        </View>

        <TouchableOpacity
          style={styles.trackDetails}
          onPress={handleTrackPress}
          activeOpacity={0.7}
        >
          <ArtworkImage
            coverArtId={coverArt}
            type="track"
            transition={0}
            style={styles.artwork}
          />

          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {artist}
            </Text>
          </View>
        </TouchableOpacity>

        {origin === "auto" && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAddToUserQueue}
            activeOpacity={0.7}
          >
            <MaterialIcons name="queue-music" size={22} color="#1DB954" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.removeButton}
          onPress={handleRemovePress}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={20} color="#ff4d4d" />
        </TouchableOpacity>
      </View>
    );
  },
  (prev, next) =>
    prev.item.clientQueueId === next.item.clientQueueId &&
    prev.item.origin === next.item.origin &&
    prev.item.title === next.item.title &&
    prev.item.artist === next.item.artist &&
    prev.item.coverArt === next.item.coverArt,
);

const styles = StyleSheet.create({
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    marginBottom: 8,
    height: 64,
  },
  dragHandle: {
    paddingHorizontal: 12,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  trackDetails: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 4,
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
  actionButton: {
    paddingHorizontal: 12,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  removeButton: {
    paddingHorizontal: 12,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
