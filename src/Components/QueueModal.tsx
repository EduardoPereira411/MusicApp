import React, { useMemo } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAudio } from "@/Context/AudioContext";
import { Image } from "expo-image";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DraggableFlatList from "react-native-draggable-flatlist";
import { QueueTrack } from "@/Components/QueueTrack"; // Adjust paths accordingly

interface QueueModalProps {
  visible: boolean;
  onClose: () => void;
}

export function QueueModal({ visible, onClose }: QueueModalProps) {
  const {
    queue,
    currentIndex,
    currentSong,
    skipToQueueIndex,
    removeFromQueue,
    updateQueueOrder,
  } = useAudio();
  const insets = useSafeAreaInsets();

  const upcomingQueueData = useMemo(() => {
    if (currentIndex < 0) return [];
    return queue.slice(currentIndex + 1).map((item, localIdx) => ({
      ...item,
      absoluteIndex: currentIndex + 1 + localIdx,
    }));
  }, [queue, currentIndex]);

  const handleDragEnd = ({ data }: { data: typeof upcomingQueueData }) => {
    const unchangedPastAndCurrent = queue.slice(0, currentIndex + 1);
    const reorderedUpcoming = data.map(
      ({ absoluteIndex, ...songProps }) => songProps,
    );
    updateQueueOrder([...unchangedPastAndCurrent, ...reorderedUpcoming]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="chevron-down" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Play Queue</Text>
            <View style={styles.headerSpacer} />
          </View>

          {currentSong && (
            <View style={styles.nowPlayingSection}>
              <Text style={styles.sectionTitle}>Now Playing</Text>
              <View style={[styles.trackRow, styles.playingRow]}>
                <View style={styles.trackDetails}>
                  {currentSong.artworkUrl ? (
                    <Image
                      source={{ uri: currentSong.artworkUrl }}
                      style={styles.artwork}
                    />
                  ) : (
                    <View style={[styles.artwork, styles.fallbackArtwork]} />
                  )}
                  <View style={styles.textContainer}>
                    <Text
                      style={[styles.title, styles.playingText]}
                      numberOfLines={1}
                    >
                      {currentSong.title}
                    </Text>
                    <Text style={styles.artist} numberOfLines={1}>
                      {currentSong.artist}
                    </Text>
                  </View>
                </View>
                <View style={styles.playingIndicator}>
                  <Ionicons name="musical-notes" size={18} color="#1DB954" />
                </View>
              </View>
            </View>
          )}

          <View style={styles.upcomingHeaderContainer}>
            <Text style={styles.sectionTitle}>Next Up</Text>
          </View>

          <DraggableFlatList
            data={upcomingQueueData}
            onDragEnd={handleDragEnd}
            keyExtractor={(item) => `${item.id}-${item.absoluteIndex}`}
            containerStyle={{ flex: 1 }}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 20 },
            ]}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No upcoming songs in queue</Text>
            }
            renderItem={({ item, drag, isActive }) => (
              <QueueTrack
                item={item}
                drag={drag}
                isActive={isActive}
                onTrackPress={skipToQueueIndex}
                onRemovePress={removeFromQueue}
              />
            )}
          />
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#282828",
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerSpacer: {
    width: 28,
  },
  nowPlayingSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  upcomingHeaderContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  sectionTitle: {
    color: "#b3b3b3",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  emptyText: {
    color: "#555",
    textAlign: "center",
    marginTop: 30,
    fontSize: 14,
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  playingRow: {
    backgroundColor: "#222",
    borderColor: "#1DB954",
    borderWidth: 1,
    paddingHorizontal: 12,
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
  playingText: {
    color: "#1DB954",
  },
  artist: {
    color: "#b3b3b3",
    fontSize: 12,
    marginTop: 2,
  },
  playingIndicator: {
    paddingRight: 6,
  },
});
