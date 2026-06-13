import React, { useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAudioStore } from "@/Stores/useAudioStore";
import { useQueueManagementStore } from "@/Stores/useQueueManagementStore";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { QueueModalContent } from "@/Components/Modals/QueueModalContent";
import {
  PlayPauseButton,
  PreviousButton,
  NextButton,
  AudioSlider,
} from "@/Components/Optimized/AudioControls";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

export function ExpandedPlayerModal() {
  const insets = useSafeAreaInsets();

  const isPlayerVisible = useQueueManagementStore(
    (state) => state.isPlayerVisible,
  );
  const isQueueVisible = useQueueManagementStore(
    (state) => state.isQueueVisible,
  );
  const closePlayer = useQueueManagementStore((state) => state.closePlayer);
  const openQueue = useQueueManagementStore((state) => state.openQueue);
  const closeQueue = useQueueManagementStore((state) => state.closeQueue);

  const currentSong = useAudioStore(
    (s) => s.queue[s.playingSongQueueIndex] || null,
  );
  const getArtworkForSong = useAudioStore((s) => s.getArtworkForSong);

  const playerTranslateY = useSharedValue(SCREEN_HEIGHT);
  const queueTranslateX = useSharedValue(SCREEN_WIDTH);

  useEffect(() => {
    playerTranslateY.value = withTiming(isPlayerVisible ? 0 : SCREEN_HEIGHT, {
      duration: 350,
      easing: Easing.out(Easing.quad),
    });
  }, [isPlayerVisible]);

  useEffect(() => {
    queueTranslateX.value = withTiming(isQueueVisible ? 0 : SCREEN_WIDTH, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
  }, [isQueueVisible]);

  useEffect(() => {
    if (isPlayerVisible) {
      const handleBack = () => {
        if (isQueueVisible) {
          closeQueue();
        } else {
          closePlayer();
        }
        return true;
      };
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        handleBack,
      );
      return () => {
        subscription.remove();
      };
    }
  }, [isPlayerVisible, isQueueVisible]);

  const playerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: playerTranslateY.value }],
  }));

  const queueAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: queueTranslateX.value }],
  }));

  if (!currentSong) return null;

  const artworkURL = getArtworkForSong(currentSong.coverArt!, 400);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.masterContainer,
        playerAnimatedStyle,
      ]}
    >
      {!isQueueVisible && (
        <View
          style={[
            styles.playerView,
            {
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: insets.bottom + 20,
            },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={closePlayer} style={styles.iconButton}>
              <Ionicons name="chevron-down" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Now Playing</Text>
            <TouchableOpacity onPress={openQueue} style={styles.iconButton}>
              <Ionicons name="list" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.artworkContainer}>
            <Image
              source={
                artworkURL
                  ? { uri: artworkURL }
                  : require("@/assets/images/icon.png")
              }
              style={styles.bigArtwork}
              cachePolicy="memory-disk"
            />
          </View>

          <View style={styles.metaContainer}>
            <Text style={styles.mainTitle} numberOfLines={1}>
              {currentSong.title}
            </Text>
            <Text style={styles.mainArtist} numberOfLines={1}>
              {currentSong.artist}
            </Text>
          </View>

          <View style={styles.sliderSection}>
            <AudioSlider />
          </View>

          <View style={styles.controlsSection}>
            <PreviousButton size={32} />
            <PlayPauseButton size={64} color="#1DB954" isCurrent={true} />
            <NextButton size={32} />
          </View>
        </View>
      )}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.queueWrapper,
          queueAnimatedStyle,
        ]}
      >
        <QueueModalContent onClose={closeQueue} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  masterContainer: {
    zIndex: 1000,
    backgroundColor: "#121212",
  },
  playerView: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    height: 60,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  iconButton: {
    padding: 4,
  },
  artworkContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  bigArtwork: {
    width: SCREEN_WIDTH - 48,
    height: SCREEN_WIDTH - 48,
    borderRadius: 8,
    backgroundColor: "#282828",
  },
  metaContainer: {
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  mainTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  mainArtist: {
    color: "#b3b3b3",
    fontSize: 16,
    marginTop: 4,
  },
  sliderSection: {
    paddingHorizontal: 12,
    height: 40,
  },
  controlsSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingVertical: 20,
  },
  queueWrapper: {
    backgroundColor: "#121212",
  },
});
