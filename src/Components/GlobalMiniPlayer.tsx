import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAudio } from "../Context/AudioContext";

export default function GlobalMiniPlayer() {
  const { currentSong, playing, togglePlayPause } = useAudio();
  const insets = useSafeAreaInsets();

  if (!currentSong) return null;

  const dynamicBottom = 49 + insets.bottom + 8;

  return (
    <View style={[styles.miniPlayerContainer, { bottom: dynamicBottom }]}>
      <View style={styles.songInfo}>
        <Text style={styles.title} numberOfLines={1}>
          {currentSong.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {currentSong.artist}
        </Text>
      </View>
      <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
        <Ionicons
          name={playing ? "pause-circle" : "play-circle"}
          size={36}
          color="#1DB954"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  miniPlayerContainer: {
    position: "absolute",
    left: 8,
    right: 8,
    backgroundColor: "#1e1e1e",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#282828",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  songInfo: {
    flex: 1,
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
  playButton: {
    paddingLeft: 10,
  },
});
