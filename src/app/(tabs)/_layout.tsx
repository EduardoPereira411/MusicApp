import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AudioProvider, useAudio } from "../../Context/AudioContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function GlobalMiniPlayer() {
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

export default function TabLayout() {
  return (
    <AudioProvider>
      <View style={{ flex: 1, backgroundColor: "#121212" }}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: "#1DB954",
            tabBarInactiveTintColor: "#888888",
            tabBarStyle: {
              backgroundColor: "#121212",
              borderTopWidth: 0,
              elevation: 0,
            },
            headerShown: false,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="search"
            options={{
              title: "Search",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="search" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: "Profile",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="person" size={size} color={color} />
              ),
            }}
          />
        </Tabs>

        <GlobalMiniPlayer />
      </View>
    </AudioProvider>
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
