import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useAudioStore } from "@/Stores/useAudioStore";
import { getArtworkUrl } from "@/Services/navidromeService";
import { QueueSong } from "@/Models/Models";
import { useAuth } from "@/Context/AuthContext";

interface QueueTrackProps {
  item: QueueSong;
}

export const QueueTrack = React.memo(
  function QueueTrack({ item }: QueueTrackProps) {
    const { clientQueueId, coverArt, title, artist, origin } = item;
    const { navidromeCreds } = useAuth();

    const skipToSongOnQueue = useAudioStore((s) => s.skipToSongOnQueue);
    const removeFromQueue = useAudioStore((s) => s.removeFromQueue);
    const updateQueueOrder = useAudioStore((s) => s.updateQueueOrder);
    const artworkUrl = useMemo(() => {
      return navidromeCreds && coverArt
        ? getArtworkUrl(navidromeCreds, coverArt, 100)
        : null;
    }, [navidromeCreds, coverArt]);

    const imageSource = useMemo(() => {
      return artworkUrl ? { uri: artworkUrl } : null;
    }, [artworkUrl]);

    const handleTrackPress = () => skipToSongOnQueue(clientQueueId);
    const handleRemovePress = () => removeFromQueue(clientQueueId);

    const handleAddToUserQueue = () => {
      const storeState = useAudioStore.getState();
      const currentQueue = storeState.queue;
      const playingSongQueueIndex = storeState.playingSongQueueIndex;

      const freshIndex = currentQueue.findIndex(
        (s) => s.clientQueueId === clientQueueId,
      );
      if (freshIndex === -1) return;

      const targetTrack = currentQueue[freshIndex];
      const cleanSong = { ...targetTrack, origin: "user" as const };

      const remainingUpcoming = currentQueue
        .slice(playingSongQueueIndex + 1)
        .filter((s) => s.clientQueueId !== clientQueueId);

      const userPart = remainingUpcoming.filter((s) => s.origin === "user");
      const autoPart = remainingUpcoming.filter((s) => s.origin === "auto");

      const targetUpcomingSegment = [...userPart, cleanSong, ...autoPart];
      const unchangedPastAndCurrent = currentQueue.slice(
        0,
        playingSongQueueIndex + 1,
      );

      updateQueueOrder([...unchangedPastAndCurrent, ...targetUpcomingSegment]);
    };

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
          {imageSource ? (
            <Image
              source={imageSource}
              style={styles.artwork}
              cachePolicy="memory-disk"
              transition={0}
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
    prev.item.origin === next.item.origin,
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
