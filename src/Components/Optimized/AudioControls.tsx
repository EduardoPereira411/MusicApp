import React from "react";
import { TouchableOpacity, StyleProp, ViewStyle } from "react-native";
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

// 1. Play/Pause Button
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

  // OPTIMIZATION: Only subscribe to 'playing' if this button is the active one.
  // If it's not the active one, we use 'false' as a constant.
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

export const AudioSlider = React.memo(function AudioSlider({
  style,
}: {
  style?: StyleProp<ViewStyle>;
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

  return (
    <Slider
      style={style}
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
      onSlidingComplete={handleSlidingComplete}
    />
  );
});
