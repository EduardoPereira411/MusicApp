import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAudio } from "@/Context/AudioContext";
import { useAudioPlayerStatus, AudioPlayer } from "expo-audio";
import Slider from "@react-native-community/slider";
import { QueueModal } from "@/Components/QueueModal";
import { useArtwork } from "@/CustomHooks/useArtwork";

const MiniPlayerSlider = React.memo(function MiniPlayerSlider({
  player,
  seekTo,
}: {
  player: AudioPlayer;
  seekTo: (v: number) => void;
}) {
  const status = useAudioPlayerStatus(player);

  return (
    <View style={styles.sliderContainer}>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={status.duration || 1}
        value={status.currentTime}
        minimumTrackTintColor="#1DB954"
        maximumTrackTintColor="#535353"
        thumbTintColor="#1DB954"
        onSlidingComplete={seekTo}
      />
    </View>
  );
});

export default function GlobalMiniPlayer() {
  const {
    currentSong,
    playing,
    togglePlayPause,
    seekTo,
    playNext,
    playPrevious,
    queue,
    currentIndex,
    player,
  } = useAudio();

  const insets = useSafeAreaInsets();
  const [queueVisible, setQueueVisible] = useState(false);
  const { url: artworkUrl } = useArtwork(currentSong?.coverArt, 100);

  if (!currentSong) return null;

  const dynamicBottom = 49 + insets.bottom + 8;

  const coverSource = useMemo(() => {
    return artworkUrl
      ? { uri: artworkUrl }
      : require("../../assets/images/icon.png");
  }, [artworkUrl]);

  const hasNext = currentIndex < queue.length - 1;
  const hasPrevious = currentIndex > 0;

  // Defensive wrappers for audio pipeline operations
  const handlePlayPrevious = async () => {
    try {
      await playPrevious();
    } catch (error) {
      console.warn("Failed to regress playback track: ", error);
    }
  };

  const handleTogglePlayPause = async () => {
    try {
      await togglePlayPause();
    } catch (error) {
      console.warn("Failed to toggle playback state: ", error);
    }
  };

  const handlePlayNext = async () => {
    try {
      await playNext();
    } catch (error) {
      console.warn("Failed to skip to next track: ", error);
    }
  };

  const handleSeek = async (value: number) => {
    try {
      await seekTo(value);
    } catch (error) {
      console.warn("Failed to update playhead location: ", error);
    }
  };

  return (
    <>
      <View style={[styles.miniPlayerContainer, { bottom: dynamicBottom }]}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.metaClickableArea}
            onPress={() => setQueueVisible(true)}
            activeOpacity={0.7}
          >
            <Image
              source={coverSource}
              style={styles.coverImage}
              cachePolicy="disk"
            />

            <View style={styles.songInfo}>
              <Text style={styles.title} numberOfLines={1}>
                {currentSong.title}
              </Text>
              <Text style={styles.artist} numberOfLines={1}>
                {currentSong.artist}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.controlsContainer}>
            <TouchableOpacity
              onPress={handlePlayPrevious}
              disabled={!hasPrevious}
              style={styles.controlButton}
            >
              <Ionicons
                name="play-back"
                size={24}
                color={hasPrevious ? "#fff" : "#555"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleTogglePlayPause}
              style={styles.playButton}
            >
              <Ionicons
                name={playing ? "pause-circle" : "play-circle"}
                size={38}
                color="#1DB954"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePlayNext}
              disabled={!hasNext}
              style={styles.controlButton}
            >
              <Ionicons
                name="play-forward"
                size={24}
                color={hasNext ? "#fff" : "#555"}
              />
            </TouchableOpacity>
          </View>
        </View>

        <MiniPlayerSlider player={player} seekTo={handleSeek} />
      </View>

      <QueueModal
        visible={queueVisible}
        onClose={() => setQueueVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  miniPlayerContainer: {
    position: "absolute",
    left: 8,
    right: 8,
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#282828",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
    paddingTop: 10,
    paddingBottom: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  metaClickableArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  coverImage: {
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: "#282828",
  },
  songInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  title: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  artist: {
    color: "#b3b3b3",
    fontSize: 12,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  controlButton: {
    paddingHorizontal: 6,
  },
  playButton: {
    paddingHorizontal: 6,
  },
  sliderContainer: {
    width: "100%",
    height: 20,
    justifyContent: "center",
    marginTop: 4,
  },
  slider: {
    width: "100%",
    height: 40,
  },
});
