import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Song, PlaybackContext } from "@/Models/Models";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useAudioStore } from "@/Stores/useAudioStore";
import { getArtworkUrl } from "@/Services/navidromeService";
import { PlayPauseButton } from "../Optimized/AudioControls";
import { useSongOptionsStore } from "@/Stores/useSongOptionsStore";

interface SongItemProps {
  item: Song;
  onPlay: (song: Song) => void;
  onOptionsPress?: (song: Song) => void;
  onSwipeLeftToRight?: (song: Song) => void;
  showTrackNumber?: boolean;
  index?: number;
  currentContext?: PlaybackContext;
}

const SWIPE_THRESHOLD = 80;

export const SongItem = React.memo(
  ({
    item,
    onPlay,
    onOptionsPress,
    onSwipeLeftToRight,
    showTrackNumber = false,
    index,
    currentContext,
  }: SongItemProps) => {
    const cachedCreds = useAudioStore((s) => s.cachedCreds);

    const openSongOptions = useSongOptionsStore(
      (state) => state.openSongOptions,
    );
    const handleOptionsPress = React.useCallback(() => {
      if (onOptionsPress) {
        onOptionsPress(item);
      } else {
        openSongOptions(item);
      }
    }, [item, onOptionsPress, openSongOptions]);

    const isCurrent = useAudioStore((state) => {
      const activeTrack = state.queue[state.playingSongQueueIndex];
      if (activeTrack?.id !== item.id) return false;

      if (!currentContext) return true;

      const ctx = activeTrack.playbackContext;
      return (
        ctx?.type === currentContext.type &&
        ctx?.id === currentContext.id &&
        (index === undefined || ctx?.songIndex === index)
      );
    });

    const displayTrackNumber =
      item.trackNumber ?? (index !== undefined ? index + 1 : null);

    const translateX = useSharedValue(0);
    const isGreen = useSharedValue(false);

    const artworkUrl =
      cachedCreds && item?.coverArt
        ? getArtworkUrl(cachedCreds, item.coverArt, 100)
        : null;

    const panGesture = Gesture.Pan()
      .activeOffsetX([-10, 10])
      .onUpdate((event) => {
        if (event.translationX > 0) {
          translateX.value = event.translationX;
          isGreen.value = event.translationX > SWIPE_THRESHOLD;
        }
      })
      .onEnd(() => {
        if (translateX.value > SWIPE_THRESHOLD) {
          isGreen.value = true;
          if (onSwipeLeftToRight) {
            scheduleOnRN(onSwipeLeftToRight, item);
          }
        }

        translateX.value = withSpring(
          0,
          { mass: 1, damping: 40, stiffness: 150 },
          (finished) => {
            if (finished) {
              isGreen.value = false;
            }
          },
        );
      });

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }],
    }));

    const backgroundAnimatedStyle = useAnimatedStyle(() => ({
      backgroundColor: isGreen.value ? "#1DB954" : "#282828",
      opacity: translateX.value > 10 ? 1 : 0,
    }));

    return (
      <GestureDetector gesture={panGesture}>
        <View style={styles.swipeContainer}>
          <Animated.View
            style={[styles.swipeBackground, backgroundAnimatedStyle]}
          >
            <Text style={styles.swipeBackgroundText}>➕ Queue</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.itemCard,
              isCurrent && styles.activeCard,
              animatedStyle,
            ]}
          >
            <TouchableOpacity
              style={styles.touchableArea}
              onPress={() => onPlay(item)}
            >
              {showTrackNumber && displayTrackNumber !== null && (
                <Text
                  style={[
                    styles.trackNumberText,
                    isCurrent && styles.activeText,
                  ]}
                >
                  {displayTrackNumber}
                </Text>
              )}

              <Image
                source={
                  artworkUrl
                    ? { uri: artworkUrl }
                    : require("@/assets/images/icon.png")
                }
                style={styles.cardArt}
                contentFit="cover"
                transition={200}
                recyclingKey={artworkUrl || ""}
                cachePolicy="memory-disk"
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

              <View style={styles.actionStatusContainer}>
                <PlayPauseButton
                  size={28}
                  style={styles.actionStatusContainer}
                  color="#1DB954"
                  item={item}
                  isCurrent={isCurrent}
                  onPlay={onPlay}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionsButton}
              onPress={handleOptionsPress}
            >
              <Text style={styles.optionsText}>⋮</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </GestureDetector>
    );
  },
  (prev, next) =>
    prev.item?.id === next.item?.id &&
    prev.index === next.index &&
    prev.currentContext?.id === next.currentContext?.id &&
    prev.currentContext?.type === next.currentContext?.type,
);

const styles = StyleSheet.create({
  actionStatusContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  swipeContainer: {
    position: "relative",
    marginBottom: 12,
  },
  swipeBackground: {
    ...StyleSheet.absoluteFill,
    borderRadius: 8,
    justifyContent: "center",
    paddingLeft: 20,
  },
  swipeBackgroundText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  itemCard: {
    backgroundColor: "#1e1e1e",
    padding: 12,
    borderRadius: 8,
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
