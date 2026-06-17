import React, { useMemo, useCallback, useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useAudioActions,
  useCurrentSong,
  useUserUpcomingQueue,
  useAutoUpcomingQueue,
} from "@/Stores/useAudioStore";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Sortable from "react-native-sortables";
import { QueueTrack } from "@/Components/ItemDisplays/QueueTrack";
import { ErrorDisplay } from "@/Components/ItemDisplays/ErrorDisplay";
import { useUiStore } from "@/Stores/useUIStore";
import { ArtworkImage } from "@/Components/ItemDisplays/ArtworkImage";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const keyExtractor = (item: any) => item.clientQueueId;

const renderQueueItem = ({ item }: { item: any }) => <QueueTrack item={item} />;

const NowPlayingHeaderTrack = React.memo(function NowPlayingHeaderTrack() {
  const currentSong = useCurrentSong();

  if (!currentSong) return null;

  return (
    <View style={styles.nowPlayingSection}>
      <Text style={styles.sectionTitle}>Now Playing</Text>
      <View style={[styles.trackRow, styles.playingRow]}>
        <View style={styles.trackDetails}>
          <ArtworkImage
            coverArtId={currentSong.coverArt}
            type="track"
            transition={150}
            style={styles.artwork}
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
  ({
    onDragEnd,
    isReady,
  }: {
    onDragEnd: (e: { data: any[] }) => void;
    isReady: boolean;
  }) => {
    const userUpcoming = useUserUpcomingQueue();

    if (!isReady || userUpcoming.length === 0) return null;

    return (
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Added by You</Text>
        <Sortable.Grid
          columns={1}
          data={userUpcoming}
          keyExtractor={keyExtractor}
          onDragEnd={onDragEnd}
          renderItem={renderQueueItem}
          measureDebounceDelay={250}
          dimensionsAnimationType="none"
          itemsLayoutTransitionMode="reorder"
        />
      </View>
    );
  },
);

const AutoUpcomingList = React.memo(
  ({
    onDragEnd,
    isReady,
  }: {
    onDragEnd: (e: { data: any[] }) => void;
    isReady: boolean;
  }) => {
    const autoUpcoming = useAutoUpcomingQueue();

    if (!isReady || autoUpcoming.length === 0) return null;

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
          measureDebounceDelay={250}
          dimensionsAnimationType="none"
          itemsLayoutTransitionMode="reorder"
        />
      </View>
    );
  },
);

export function QueueModalContent() {
  const insets = useSafeAreaInsets();
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const closeModal = useUiStore((state) => state.closeModal);
  const closeQueue = () => closeModal("queue-modal");
  const isQueueVisible = useUiStore((state) => !!state.modals["queue-modal"]);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  const { reorderUpcomingQueue } = useAudioActions();

  const idleCallbackRef = React.useRef<number | null>(null);

  useEffect(() => {
    if (!isQueueVisible) {
      setIsAnimationComplete(false);
      if (idleCallbackRef.current !== null) {
        cancelIdleCallback(idleCallbackRef.current);
        idleCallbackRef.current = null;
      }
    }
  }, [isQueueVisible]);

  const handleModalShow = useCallback(() => {
    idleCallbackRef.current = requestIdleCallback(() => {
      setIsAnimationComplete(true);
      idleCallbackRef.current = null;
    });
  }, []);

  const handleUserDragEnd = useCallback(
    ({ data }: { data: any[] }) => {
      try {
        setPipelineError(null);
        reorderUpcomingQueue(data, "user");
      } catch (err) {
        setPipelineError("Failed to synchronize modified layout.");
      }
    },
    [reorderUpcomingQueue],
  );

  const handleAutoDragEnd = useCallback(
    ({ data }: { data: any[] }) => {
      try {
        setPipelineError(null);
        reorderUpcomingQueue(data, "auto");
      } catch (err) {
        setPipelineError("Failed to synchronize modified layout.");
      }
    },
    [reorderUpcomingQueue],
  );

  const clearPipelineErrors = useCallback(() => setPipelineError(null), []);

  return (
    <Modal
      visible={isQueueVisible}
      animationType="none"
      transparent={true}
      onRequestClose={closeQueue}
      onShow={handleModalShow}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View
          entering={SlideInDown.springify().damping(200)}
          exiting={SlideOutDown.duration(200)}
          style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={closeQueue} style={styles.closeButton}>
              <Ionicons name="chevron-down" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Play Queue</Text>
            <View style={styles.headerSpacer} />
          </View>

          {pipelineError && (
            <ErrorDisplay
              title="Queue Mutation Exception"
              message={pipelineError}
              onRetry={clearPipelineErrors}
              retryButtonTitle="Dismiss Notification"
            />
          )}

          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 20 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <NowPlayingHeaderTrack />

            {isAnimationComplete ? (
              <>
                <UserUpcomingList
                  onDragEnd={handleUserDragEnd}
                  isReady={true}
                />
                <AutoUpcomingList
                  onDragEnd={handleAutoDragEnd}
                  isReady={true}
                />
              </>
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#1DB954" />
                <Text style={styles.loadingText}>Loading Queue Layout...</Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    paddingTop: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#b3b3b3",
    fontSize: 12,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
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
  sectionTitle: {
    color: "#b3b3b3",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
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
