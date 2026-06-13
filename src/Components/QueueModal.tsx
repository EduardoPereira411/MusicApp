import React, { useMemo, useCallback, useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  BackHandler,
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
import { useShallow } from "zustand/react/shallow";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const keyExtractor = (item: any) => item.clientQueueId;

const renderQueueItem = ({ item }: { item: any }) => {
  return <QueueTrack item={item} />;
};

const NowPlayingHeaderTrack = React.memo(function NowPlayingHeaderTrack() {
  const currentSong = useAudioStore(
    (s) => s.queue[s.playingSongQueueIndex] || null,
  );

  const cachedCreds = useAudioStore((s) => s.cachedCreds);

  const artworkUrl = useMemo(() => {
    return cachedCreds && currentSong?.coverArt
      ? getArtworkUrl(cachedCreds, currentSong.coverArt, 100)
      : null;
  }, [cachedCreds, currentSong?.coverArt]);

  if (!currentSong) return null;

  return (
    <View style={styles.nowPlayingSection}>
      <Text style={styles.sectionTitle}>Now Playing</Text>
      <View style={[styles.trackRow, styles.playingRow]}>
        <View style={styles.trackDetails}>
          <Image
            source={artworkUrl ? { uri: artworkUrl } : undefined}
            style={styles.artwork}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
          />
          <View style={styles.textContainer}>
            <Text style={[styles.title, styles.playingText]} numberOfLines={1}>
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
  );
});

const UserUpcomingList = React.memo(
  ({ onDragEnd }: { onDragEnd: (e: { data: any[] }) => void }) => {
    const userUpcoming = useAudioStore(
      useShallow((s) => {
        if (s.playingSongQueueIndex < 0) return [];
        return s.queue
          .slice(s.playingSongQueueIndex + 1)
          .filter((item) => item.origin !== "auto");
      }),
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
          renderItem={renderQueueItem}
          measureDebounceDelay={150}
          dimensionsAnimationType="none"
          itemsLayoutTransitionMode="reorder"
        />
      </View>
    );
  },
);

const AutoUpcomingList = React.memo(
  ({ onDragEnd }: { onDragEnd: (e: { data: any[] }) => void }) => {
    const autoUpcoming = useAudioStore(
      useShallow((s) => {
        if (s.playingSongQueueIndex < 0) return [];
        return s.queue
          .slice(s.playingSongQueueIndex + 1)
          .filter((item) => item.origin === "auto");
      }),
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
          renderItem={renderQueueItem}
          measureDebounceDelay={150}
          dimensionsAnimationType="none"
          itemsLayoutTransitionMode="reorder"
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

  const updateQueueOrder = useAudioStore((s) => s.updateQueueOrder);

  const translateY = useSharedValue(SCREEN_HEIGHT);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : SCREEN_HEIGHT, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });

    if (visible) {
      const handleHardwareBackPress = () => {
        closeModal();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        handleHardwareBackPress,
      );
      return () => {
        subscription.remove();
      };
    }
  }, [visible, closeModal]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const applyQueueUpdate = useCallback(
    (newUpcomingSegment: any[]) => {
      setPipelineError(null);
      try {
        const { queue, playingSongQueueIndex } = useAudioStore.getState();
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
            lastUserIndex !== -1 &&
            index <= lastUserIndex
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
    [updateQueueOrder],
  );

  const handleUserDragEnd = useCallback(
    ({ data }: { data: any[] }) => {
      const { queue, playingSongQueueIndex } = useAudioStore.getState();
      const autoUpcoming = queue
        .slice(playingSongQueueIndex + 1)
        .filter((s) => s.origin === "auto");
      applyQueueUpdate([...data, ...autoUpcoming]);
    },
    [applyQueueUpdate],
  );

  const handleAutoDragEnd = useCallback(
    ({ data }: { data: any[] }) => {
      const { queue, playingSongQueueIndex } = useAudioStore.getState();
      const userUpcoming = queue
        .slice(playingSongQueueIndex + 1)
        .filter((s) => s.origin !== "auto");
      applyQueueUpdate([...userUpcoming, ...data]);
    },
    [applyQueueUpdate],
  );

  const clearPipelineErrors = useCallback(() => setPipelineError(null), []);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.modalOverlay, animatedStyle]}
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
            <NowPlayingHeaderTrack />
            <UserUpcomingList onDragEnd={handleUserDragEnd} />
            <AutoUpcomingList onDragEnd={handleAutoDragEnd} />
          </ScrollView>
        </View>
      </GestureHandlerRootView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    zIndex: 1000,
    backgroundColor: "#121212",
  },
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
