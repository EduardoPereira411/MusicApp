import React from "react";
import { TouchableOpacity, StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAudioStore } from "@/Stores/useAudioStore";
import { useToast } from "@/Context/ToastContext";
import { View } from "react-native";

interface PlayPauseButtonProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
  color?: string;
}

export const PlayPauseButton = React.memo(function PlayPauseButton({
  size = 38,
  style,
  color = "#1DB954",
}: PlayPauseButtonProps) {
  const playing = useAudioStore((s) => s.playing);
  const togglePlayPause = useAudioStore((s) => s.togglePlayPause);
  const { showToast } = useToast();

  const handleTogglePlayPause = async () => {
    try {
      await togglePlayPause();
    } catch (error: any) {
      showToast(`Playback action failed: ${error.message || error}`, "error");
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={handleTogglePlayPause} style={style}>
        <Ionicons
          name={playing ? "pause-circle" : "play-circle"}
          size={size}
          color={color}
        />
      </TouchableOpacity>
    </View>
  );
});
