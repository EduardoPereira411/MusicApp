import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAudioStore } from "@/Stores/useAudioStore";
import {
  PlayPauseButton,
  PreviousButton,
  NextButton,
  AudioSlider,
} from "@/Components/Optimized/AudioControls";
import { useQueueManagementStore } from "@/Stores/useQueueManagementStore";

const MiniPlayerMeta = React.memo(
  function MiniPlayerMeta({ song }: { song: any }) {
    const getArtworkForSong = useAudioStore((s) => s.getArtworkForSong);
    const artworkURL = useMemo(
      () => getArtworkForSong(song.coverArt, 100),
      [song, getArtworkForSong],
    );
    return (
      <>
        <Image
          source={
            artworkURL
              ? { uri: artworkURL }
              : require("@/assets/images/icon.png")
          }
          style={styles.coverImage}
          cachePolicy="memory-disk"
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
  const isPlayerVisible = useQueueManagementStore(
    (state) => state.isPlayerVisible,
  );
  const insets = useSafeAreaInsets();

  const openFullPlayer = useQueueManagementStore((state) => state.openPlayer);

  const currentSong = useAudioStore((s) => {
    const idx = s.playingSongQueueIndex;
    return idx >= 0 && idx < s.queue.length ? s.queue[idx] : null;
  });

  if (!currentSong) return null;

  const dynamicBottom = 49 + insets.bottom + 8;

  return (
    <>
      <View pointerEvents={isPlayerVisible ? "none" : "auto"}>
        <View style={[styles.miniPlayerContainer, { bottom: dynamicBottom }]}>
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.metaClickableArea}
              onPress={openFullPlayer}
              activeOpacity={0.7}
            >
              <MiniPlayerMeta song={currentSong} />
            </TouchableOpacity>

            <View style={styles.controlsContainer}>
              <PreviousButton style={styles.controlButton} />
              <PlayPauseButton
                size={38}
                style={styles.playButton}
                color="#1DB954"
                isCurrent={true}
              />
              <NextButton style={styles.controlButton} />
            </View>
          </View>

          <View style={styles.sliderContainer}>
            <AudioSlider style={styles.slider} />
          </View>
        </View>
      </View>
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
