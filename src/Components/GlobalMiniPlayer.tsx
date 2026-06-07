import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToast } from "@/Context/ToastContext";
import { useAudioPlayerStatus } from "expo-audio";
import Slider from "@react-native-community/slider";
import { QueueModal } from "@/Components/QueueModal";
import { useAudioStore } from "@/Stores/useAudioStore";
import { PlayPauseButton } from "@/Components/Optimized/PlayPauseButton";

const MiniPlayerSlider = React.memo(function MiniPlayerSlider({
  seekTo,
}: {
  seekTo: (v: number) => void;
}) {
  const player = useAudioStore((s) => s.player);
  if (!player) return null;
  const status = useAudioPlayerStatus(player);
  const [isSliding, setIsSliding] = useState(false);
  const [localValue, setLocalValue] = useState(0);

  return (
    <View style={styles.sliderContainer}>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={status.duration || 1}
        value={isSliding ? localValue : status.currentTime}
        minimumTrackTintColor="#1DB954"
        maximumTrackTintColor="#535353"
        thumbTintColor="#1DB954"
        onValueChange={(val) => {
          setIsSliding(true);
          setLocalValue(val);
        }}
        onSlidingComplete={(val) => {
          seekTo(val);
          setTimeout(() => {
            setIsSliding(false);
          }, 150);
        }}
      />
    </View>
  );
});

const MiniPlayerMeta = React.memo(
  function MiniPlayerMeta({ song }: { song: any }) {
    const getArtworkForSong = useAudioStore((s) => s.getArtworkForSong);
    const artworkURL = useMemo(
      () => getArtworkForSong(song.coverArt, 300),
      [song, getArtworkForSong],
    );
    React.useEffect(() => {
      console.log("MiniPlayerMeta re-rendered. New URL:", artworkURL);
    });
    return (
      <>
        <Image
          source={
            artworkURL
              ? { uri: artworkURL }
              : require("../../assets/images/icon.png")
          }
          style={styles.coverImage}
          cachePolicy="disk"
        />
        <View style={styles.songInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {song.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {song.artist}
          </Text>
        </View>
      </>
    );
  },
  (prev, next) => prev.song?.id === next.song?.id,
);

export default function GlobalMiniPlayer() {
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [queueVisible, setQueueVisible] = useState(false);

  const queue = useAudioStore((s) => s.queue);
  const playingSongQueueIndex = useAudioStore((s) => s.playingSongQueueIndex);

  const seekTo = useAudioStore((s) => s.seekTo);
  const playNext = useAudioStore((s) => s.playNext);
  const playPrevious = useAudioStore((s) => s.playPrevious);

  const currentSong = useMemo(() => {
    if (playingSongQueueIndex >= 0 && playingSongQueueIndex < queue.length) {
      return queue[playingSongQueueIndex];
    }
    return null;
  }, [queue, playingSongQueueIndex]);

  if (!currentSong) return null;

  const dynamicBottom = 49 + insets.bottom + 8;
  const hasNext = playingSongQueueIndex < queue.length - 1;
  const hasPrevious = playingSongQueueIndex > 0;

  const handlePlayPrevious = async () => {
    try {
      await playPrevious(showToast);
    } catch (error: any) {
      showToast(`Couldn't change track: ${error.message || error}`, "error");
    }
  };

  const handlePlayNext = async () => {
    try {
      await playNext();
    } catch (error: any) {
      showToast(`Skipping track failed: ${error.message || error}`, "error");
    }
  };

  const handleSeek = async (value: number) => {
    try {
      await seekTo(value);
    } catch (error: any) {
      showToast(`Failed to seek: ${error.message || error}`, "error");
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
            <MiniPlayerMeta song={currentSong} />
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

            <PlayPauseButton size={38} style={styles.playButton} />

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

        <MiniPlayerSlider seekTo={handleSeek} />
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
