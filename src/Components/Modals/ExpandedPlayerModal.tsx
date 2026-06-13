import React, { useEffect, useState } from "react";
import {
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
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useRouter } from "expo-router";

import { QueueModalContent } from "@/Components/Modals/QueueModalContent";
import { AddToPlaylistModal } from "@/Components/Modals/AddToPlaylistModal";
import {
  PlayPauseButton,
  PreviousButton,
  NextButton,
  AudioSlider,
} from "@/Components/Optimized/AudioControls";
import { useUiStore } from "@/Stores/useUIStore";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

export function ExpandedPlayerModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const isPlayerVisible = useUiStore(
    (state) => !!state.modals["expanded-player"],
  );
  const isQueueVisible = useUiStore((state) => !!state.modals["queue-modal"]);
  const openModal = useUiStore((state) => state.openModal);
  const closeModal = useUiStore((state) => state.closeModal);

  const closePlayer = () => {
    closeModal("expanded-player");
    closeModal("queue-modal");
  };
  const openQueue = () => openModal("queue-modal");
  const closeQueue = () => closeModal("queue-modal");

  const currentSong = useAudioStore(
    (s) => s.queue[s.playingSongQueueIndex] || null,
  );
  const getArtworkForSong = useAudioStore((s) => s.getArtworkForSong);

  const playerTranslateY = useSharedValue(SCREEN_HEIGHT);
  const queueTranslateX = useSharedValue(SCREEN_WIDTH);

  const [renderPlayer, setRenderPlayer] = useState(!isQueueVisible);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);

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
    if (isQueueVisible) {
      const timer = setTimeout(() => {
        setRenderPlayer(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setRenderPlayer(true);
    }
  }, [isQueueVisible]);

  const [artworkURL, setArtworkUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isPlayerVisible && currentSong) {
      const url = getArtworkForSong(currentSong.coverArt!, 300);
      setArtworkUrl(url);
    }
  }, [isPlayerVisible, currentSong, getArtworkForSong]);

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

  const handleGoToAlbum = () => {
    if (!currentSong?.albumId) return;
    closePlayer();
    router.push({
      pathname: "/playlist",
      params: {
        id: currentSong.albumId,
        type: "album",
        name: currentSong.album || "Album",
      },
    });
  };

  const playerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: playerTranslateY.value }],
  }));

  const queueAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: queueTranslateX.value }],
  }));

  if (!currentSong) return null;

  return (
    <>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.masterContainer,
          playerAnimatedStyle,
        ]}
      >
        {renderPlayer && (
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
              <View style={styles.metaTextWrapper}>
                <Text style={styles.mainTitle} numberOfLines={1}>
                  {currentSong.title}
                </Text>
                <Text style={styles.mainArtist} numberOfLines={1}>
                  {currentSong.artist}
                </Text>
              </View>
            </View>

            <View style={styles.actionsBar}>
              {currentSong.albumId && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleGoToAlbum}
                >
                  <Ionicons name="disc-outline" size={22} color="#b3b3b3" />
                  <Text style={styles.actionButtonText}>Album</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setPlaylistModalVisible(true)}
              >
                <Ionicons name="add-circle-outline" size={22} color="#b3b3b3" />
                <Text style={styles.actionButtonText}>Add to Playlist</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sliderSection}>
              <AudioSlider showTime={true} />
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

      <AddToPlaylistModal
        visible={playlistModalVisible}
        onClose={() => setPlaylistModalVisible(false)}
        song={currentSong}
      />
    </>
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
    marginBottom: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaTextWrapper: {
    flex: 1,
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
  actionsBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 24,
    marginVertical: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#282828",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
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
