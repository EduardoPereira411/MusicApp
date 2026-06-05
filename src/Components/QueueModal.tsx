import { useMemo, useCallback, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAudio } from "@/Context/AudioContext";
import { useArtwork } from "@/CustomHooks/useArtwork";
import { Image } from "expo-image";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Sortable from "react-native-sortables";
import { QueueTrack } from "@/Components/QueueTrack";
import { ErrorDisplay } from "@/Components/ErrorDisplay";

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

  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const { url: currentArtworkUrl } = useArtwork(currentSong?.coverArt, 150);

  const { userUpcoming, autoUpcoming } = useMemo(() => {
    if (currentIndex < 0) return { userUpcoming: [], autoUpcoming: [] };

    const userList: any[] = [];
    const autoList: any[] = [];

    queue.slice(currentIndex + 1).forEach((item: any, localIdx) => {
      const absoluteIndex = currentIndex + 1 + localIdx;
      const itemWithMeta = { ...item, absoluteIndex };

      if (item.origin === "auto") {
        autoList.push(itemWithMeta);
      } else {
        userList.push(itemWithMeta);
      }
    });

    return { userUpcoming: userList, autoUpcoming: autoList };
  }, [queue, currentIndex]);

  const handleTrackPress = useCallback(
    (idx: number) => {
      try {
        setPipelineError(null);
        skipToQueueIndex(idx);
      } catch (err: any) {
        setPipelineError("Failed to switch tracks inside current playlist.");
      }
    },
    [skipToQueueIndex],
  );

  const handleRemovePress = useCallback(
    (idx: number) => {
      try {
        setPipelineError(null);
        removeFromQueue(idx);
      } catch (err: any) {
        setPipelineError("Could not remove the selected item from queue.");
      }
    },
    [removeFromQueue],
  );

  const applyQueueUpdate = useCallback(
    (newUpcomingSegment: any[]) => {
      setPipelineError(null);
      try {
        const unchangedPastAndCurrent = queue.slice(0, currentIndex + 1);

        let lastUserIndex = -1;
        newUpcomingSegment.forEach((item, idx) => {
          if (item.origin === "user") lastUserIndex = idx;
        });

        const validatedUpcoming = newUpcomingSegment.map((item, index) => {
          const cleanSong = { ...item };
          delete cleanSong.absoluteIndex;

          if (
            item.origin === "auto" &&
            (index <= lastUserIndex || (lastUserIndex === -1 && index === 0))
          ) {
            return { ...cleanSong, origin: "user" as const };
          }
          return cleanSong;
        });

        updateQueueOrder([...unchangedPastAndCurrent, ...validatedUpcoming]);
      } catch (err: any) {
        setPipelineError(
          "Failed to synchronize the modified queue arrangement.",
        );
      }
    },
    [queue, currentIndex, updateQueueOrder],
  );

  const handleUserDragEnd = useCallback(
    ({ data }: { data: any[] }) => {
      const combinedUpcoming = [...data, ...autoUpcoming];
      applyQueueUpdate(combinedUpcoming);
    },
    [autoUpcoming, applyQueueUpdate],
  );

  const handleAutoDragEnd = useCallback(
    ({ data }: { data: any[] }) => {
      const combinedUpcoming = [...userUpcoming, ...data];
      applyQueueUpdate(combinedUpcoming);
    },
    [userUpcoming, applyQueueUpdate],
  );

  const handleAddToUserQueue = useCallback(
    (trackToPromote: any) => {
      setPipelineError(null);
      try {
        const cleanSong = { ...trackToPromote, origin: "user" as const };
        delete cleanSong.absoluteIndex;
        const currentUpcomingClean = queue
          .slice(currentIndex + 1)
          .map((s: any) => {
            const copy = { ...s };
            delete copy.absoluteIndex;
            return copy;
          });

        const remainingUpcoming = currentUpcomingClean.filter(
          (s) => s.clientQueueId !== cleanSong.clientQueueId,
        );

        const userPart = remainingUpcoming.filter((s) => s.origin === "user");
        const autoPart = remainingUpcoming.filter((s) => s.origin === "auto");
        const targetUpcomingSegment = [...userPart, cleanSong, ...autoPart];
        const unchangedPastAndCurrent = queue.slice(0, currentIndex + 1);

        updateQueueOrder([
          ...unchangedPastAndCurrent,
          ...targetUpcomingSegment,
        ]);
      } catch (err: any) {
        setPipelineError("Unable to prioritize recommendation index.");
      }
    },
    [queue, currentIndex, updateQueueOrder],
  );

  const renderUserQueueTrack = useCallback(
    ({ item }: { item: any }) => (
      <QueueTrack
        item={item}
        onTrackPress={handleTrackPress}
        onRemovePress={handleRemovePress}
      />
    ),
    [handleTrackPress, handleRemovePress],
  );

  const renderAutoQueueTrack = useCallback(
    ({ item }: { item: any }) => (
      <QueueTrack
        item={item}
        onTrackPress={handleTrackPress}
        onRemovePress={handleRemovePress}
        onAddToUserQueue={handleAddToUserQueue}
      />
    ),
    [handleTrackPress, handleRemovePress, handleAddToUserQueue],
  );

  const keyExtractor = useCallback((item: any) => item.clientQueueId, []);

  const clearPipelineErrors = useCallback(() => {
    setPipelineError(null);
  }, []);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
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
          <ErrorDisplay
            title="Queue Mutation Exception"
            message={pipelineError}
            onRetry={clearPipelineErrors}
            retryButtonTitle="Dismiss Notification"
          />

          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 20 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {currentSong && (
              <View style={styles.nowPlayingSection}>
                <Text style={styles.sectionTitle}>Now Playing</Text>
                <View style={[styles.trackRow, styles.playingRow]}>
                  <View style={styles.trackDetails}>
                    <Image
                      source={
                        currentArtworkUrl
                          ? { uri: currentArtworkUrl }
                          : undefined
                      }
                      style={styles.artwork}
                      contentFit="cover"
                      transition={150}
                    />
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

            {userUpcoming.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Added by You</Text>
                <Sortable.Grid
                  columns={1}
                  data={userUpcoming}
                  keyExtractor={keyExtractor}
                  onDragEnd={handleUserDragEnd}
                  renderItem={renderUserQueueTrack}
                />
              </View>
            )}

            {autoUpcoming.length > 0 && (
              <View style={[styles.sectionBlock, { marginTop: 16 }]}>
                <View style={styles.autoHeaderRow}>
                  <Text style={styles.sectionTitle}>
                    Autoplay Recommendations
                  </Text>
                </View>
                <Sortable.Grid
                  columns={1}
                  data={autoUpcoming}
                  keyExtractor={keyExtractor}
                  onDragEnd={handleAutoDragEnd}
                  renderItem={renderAutoQueueTrack}
                />
              </View>
            )}

            {userUpcoming.length === 0 && autoUpcoming.length === 0 && (
              <Text style={styles.emptyText}>No upcoming songs in queue</Text>
            )}
          </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#282828",
    marginBottom: 4,
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
    paddingTop: 16,
    paddingBottom: 8,
  },
  upcomingHeaderContainer: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionTitle: {
    color: "#b3b3b3",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
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
  autoHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionBlock: {
    marginBottom: 8,
  },
});
