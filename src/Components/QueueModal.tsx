import React, { useMemo, useCallback, useState } from "react";
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
import { useAudioStore } from "@/Stores/useAudioStore";
import { Image } from "expo-image";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Sortable from "react-native-sortables";
import { QueueTrack } from "@/Components/QueueTrack";
import { ErrorDisplay } from "@/Components/ErrorDisplay";
import { getArtworkUrl } from "@/Services/navidromeService";
import { useQueueManagementStore } from "@/Stores/useQueueManagementStore";

const keyExtractor = (item: any) => item.clientQueueId;

const NowPlayingHeaderTrack = React.memo(
  function NowPlayingHeaderTrack({ song }: { song: any }) {
    const cachedCreds = useAudioStore((s) => s.cachedCreds);
    const artworkUrl = useMemo(() => {
      return cachedCreds && song?.coverArt
        ? getArtworkUrl(cachedCreds, song.coverArt, 150)
        : null;
    }, [cachedCreds, song?.coverArt]);

    return (
      <View style={[styles.trackRow, styles.playingRow]}>
        <View style={styles.trackDetails}>
          <Image
            source={artworkUrl ? { uri: artworkUrl } : undefined}
            style={styles.artwork}
            contentFit="cover"
            transition={150}
          />
          <View style={styles.textContainer}>
            <Text style={[styles.title, styles.playingText]} numberOfLines={1}>
              {song.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {song.artist}
            </Text>
          </View>
        </View>
        <View style={styles.playingIndicator}>
          <Ionicons name="musical-notes" size={18} color="#1DB954" />
        </View>
      </View>
    );
  },
  (prev, next) => prev.song?.clientQueueId === next.song?.clientQueueId,
);

const UserUpcomingList = React.memo(
  ({
    userUpcoming,
    onDragEnd,
  }: {
    userUpcoming: any[];
    onDragEnd: (e: { data: any[] }) => void;
  }) => {
    const renderItem = useCallback(
      ({ item }: { item: any }) => <QueueTrack item={item} />,
      [],
    );

    if (userUpcoming.length === 0) return null;

    return (
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Added by You</Text>
        <Sortable.Grid
          columns={1}
          data={userUpcoming}
          keyExtractor={keyExtractor}
          onDragEnd={onDragEnd}
          renderItem={renderItem}
        />
      </View>
    );
  },
);

const AutoUpcomingList = React.memo(
  ({
    autoUpcoming,
    onDragEnd,
  }: {
    autoUpcoming: any[];
    onDragEnd: (e: { data: any[] }) => void;
  }) => {
    const renderItem = useCallback(
      ({ item }: { item: any }) => <QueueTrack item={item} />,
      [],
    );

    if (autoUpcoming.length === 0) return null;

    return (
      <View style={[styles.sectionBlock, { marginTop: 16 }]}>
        <View style={styles.autoHeaderRow}>
          <Text style={styles.sectionTitle}>Autoplay Recommendations</Text>
        </View>
        <Sortable.Grid
          columns={1}
          data={autoUpcoming}
          keyExtractor={keyExtractor}
          onDragEnd={onDragEnd}
          renderItem={renderItem}
        />
      </View>
    );
  },
);

export function QueueModal() {
  const insets = useSafeAreaInsets();
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const visible = useQueueManagementStore((state) => state.isModalVisible);
  const closeModal = useQueueManagementStore((state) => state.closeQueueModal);

  const queue = useAudioStore((s) => s.queue);
  const playingSongQueueIndex = useAudioStore((s) => s.playingSongQueueIndex);
  const updateQueueOrder = useAudioStore((s) => s.updateQueueOrder);

  const currentSong = useMemo(() => {
    return queue[playingSongQueueIndex] || null;
  }, [queue, playingSongQueueIndex]);

  const { userUpcoming, autoUpcoming } = useMemo(() => {
    if (playingSongQueueIndex < 0)
      return { userUpcoming: [], autoUpcoming: [] };

    const userList: any[] = [];
    const autoList: any[] = [];

    queue.slice(playingSongQueueIndex + 1).forEach((item: any) => {
      if (item.origin === "auto") {
        autoList.push(item);
      } else {
        userList.push(item);
      }
    });

    return { userUpcoming: userList, autoUpcoming: autoList };
  }, [queue, playingSongQueueIndex]);

  const applyQueueUpdate = useCallback(
    (newUpcomingSegment: any[]) => {
      setPipelineError(null);
      try {
        const unchangedPastAndCurrent = queue.slice(
          0,
          playingSongQueueIndex + 1,
        );
        let lastUserIndex = -1;

        newUpcomingSegment.forEach((item, idx) => {
          if (item.origin === "user") lastUserIndex = idx;
        });

        const validatedUpcoming = newUpcomingSegment.map((item, index) => {
          if (
            item.origin === "auto" &&
            (index <= lastUserIndex || (lastUserIndex === -1 && index === 0))
          ) {
            return { ...item, origin: "user" as const };
          }
          return item;
        });

        updateQueueOrder([...unchangedPastAndCurrent, ...validatedUpcoming]);
      } catch (err) {
        setPipelineError("Failed to synchronize modified layout.");
      }
    },
    [queue, playingSongQueueIndex, updateQueueOrder],
  );

  const handleUserDragEnd = useCallback(
    ({ data }: { data: any[] }) => {
      applyQueueUpdate([...data, ...autoUpcoming]);
    },
    [autoUpcoming, applyQueueUpdate],
  );

  const handleAutoDragEnd = useCallback(
    ({ data }: { data: any[] }) => {
      applyQueueUpdate([...userUpcoming, ...data]);
    },
    [userUpcoming, applyQueueUpdate],
  );

  const clearPipelineErrors = useCallback(() => setPipelineError(null), []);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={closeModal}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
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
                <NowPlayingHeaderTrack song={currentSong} />
              </View>
            )}

            <UserUpcomingList
              userUpcoming={userUpcoming}
              onDragEnd={handleUserDragEnd}
            />
            <AutoUpcomingList
              autoUpcoming={autoUpcoming}
              onDragEnd={handleAutoDragEnd}
            />

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
