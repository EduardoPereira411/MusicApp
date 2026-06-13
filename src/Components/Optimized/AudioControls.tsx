import React from "react";
import {
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  View,
  StyleSheet,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAudioStore } from "@/Stores/useAudioStore";
import { useToast } from "@/Context/ToastContext";
import { useAudioPlayerStatus } from "expo-audio";
import Slider from "@react-native-community/slider";
import { useState, useCallback } from "react";
import { Song } from "@/Models/Models";

interface ControlProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
  color?: string;
  disabledColor?: string;
}

interface PlayPauseButtonProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
  color?: string;
  // Optional props for List Item Mode
  item?: Song;
  onPlay?: (song: Song) => void;
  isCurrent?: boolean;
}

export const PlayPauseButton = React.memo(function PlayPauseButton({
  size = 38,
  style,
  color = "#1DB954",
  item,
  onPlay,
  isCurrent = false,
}: PlayPauseButtonProps) {
  const togglePlayPause = useAudioStore((s) => s.togglePlayPause);

  const playing = useAudioStore((s) => (isCurrent ? s.playing : false));

  const handlePress = () => {
    if (item && !isCurrent) {
      onPlay!(item);
    } else {
      togglePlayPause();
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={style}>
      <Ionicons
        name={playing ? "pause-circle" : "play-circle"}
        size={size}
        color={color}
      />
    </TouchableOpacity>
  );
});

export const ItemPlayPauseButton = React.memo(
  ({
    item,

    onPlay,

    isCurrent,
  }: {
    item: Song;

    onPlay: (song: Song) => void;

    isCurrent: boolean;
  }) => {
    const showAsPlaying = useAudioStore((s) => s.playing && isCurrent);

    const togglePlayPause = useAudioStore((s) => s.togglePlayPause);

    const handlePress = () => {
      if (isCurrent) {
        togglePlayPause();
      } else {
        onPlay(item);
      }
    };

    return (
      <TouchableOpacity onPress={handlePress}>
        <Ionicons
          name={showAsPlaying ? "pause-circle" : "play-circle"}
          size={28}
          color={"#1DB954"}
        />
      </TouchableOpacity>
    );
  },
);

export const NextButton = React.memo(function NextButton({
  size = 24,
  style,
  color = "#fff",
  disabledColor = "#555",
}: ControlProps) {
  const hasNext = useAudioStore(
    (s) => s.playingSongQueueIndex < s.queue.length - 1,
  );
  const playNext = useAudioStore((s) => s.playNext);
  const { showToast } = useToast();

  return (
    <TouchableOpacity
      onPress={() => playNext(showToast)}
      disabled={!hasNext}
      style={style}
    >
      <Ionicons
        name="play-forward"
        size={size}
        color={hasNext ? color : disabledColor}
      />
    </TouchableOpacity>
  );
});

export const PreviousButton = React.memo(function PreviousButton({
  size = 24,
  style,
  color = "#fff",
  disabledColor = "#555",
}: ControlProps) {
  const hasPrevious = useAudioStore((s) => s.playingSongQueueIndex > 0);
  const playPrevious = useAudioStore((s) => s.playPrevious);
  const { showToast } = useToast();
  return (
    <TouchableOpacity
      onPress={() => playPrevious(showToast)}
      disabled={!hasPrevious}
      style={style}
    >
      <Ionicons
        name="play-back"
        size={size}
        color={hasPrevious ? color : disabledColor}
      />
    </TouchableOpacity>
  );
});

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

export const AudioSlider = React.memo(function AudioSlider({
  style,
  showTime = false,
}: {
  style?: StyleProp<ViewStyle>;
  showTime?: boolean;
}) {
  const player = useAudioStore((s) => s.player);
  const seekTo = useAudioStore((s) => s.seekTo);

  if (!player) return null;

  const status = useAudioPlayerStatus(player);
  const [isSliding, setIsSliding] = useState(false);
  const [localValue, setLocalValue] = useState(0);

  const handleSlidingComplete = useCallback(
    (val: number) => {
      seekTo(val);
      const timer = setTimeout(() => {
        setIsSliding(false);
      }, 150);

      return () => clearTimeout(timer);
    },
    [seekTo],
  );

  const currentTime = isSliding ? localValue : status.currentTime;
  const totalDuration = status.duration || 0;

  return (
    <View style={[style, !showTime && styles.miniWrapper]}>
      <Slider
        minimumValue={0}
        maximumValue={totalDuration || 1}
        value={currentTime}
        minimumTrackTintColor="#1DB954"
        maximumTrackTintColor="#535353"
        thumbTintColor="#1DB954"
        style={!showTime ? styles.compactSlider : styles.defaultSlider}
        onValueChange={(val) => {
          setIsSliding(true);
          setLocalValue(val);
        }}
        onSlidingComplete={handleSlidingComplete}
      />

      {showTime && (
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <Text style={styles.timeText}>{formatTime(totalDuration)}</Text>
        </View>
      )}
    </View>
  );
});
const styles = StyleSheet.create({
  defaultSlider: {
    width: "100%",
    height: 40,
  },
  compactSlider: {
    width: "100%",
    height: 14,
    marginVertical: 0,
  },
  miniWrapper: {
    justifyContent: "center",
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginTop: -4,
  },
  timeText: {
    color: "#b3b3b3",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
});
