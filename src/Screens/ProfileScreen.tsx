import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  authStorage,
  fetchNavidromePlaylists,
} from "../Services/navidromeService";

export default function ProfileScreen() {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    setLoading(true);
    // Fetch username to display on the profile
    const creds = await authStorage.getCredentials();
    if (creds?.username) {
      setUsername(creds.username);
    }
    await loadPlaylists();
    setLoading(false);
  }

  async function loadPlaylists() {
    try {
      const list = await fetchNavidromePlaylists();
      setPlaylists(list);
    } catch (e) {
      console.error("Failed fetching user playlists:", e);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadPlaylists();
    setIsRefreshing(false);
  }

  async function handleLogout() {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await authStorage.clearCredentials();
          router.replace("/login");
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {username ? username.charAt(0).toUpperCase() : "U"}
          </Text>
        </View>
        <Text style={styles.username}>{username || "User Profile"}</Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionHeader}>Your Playlists</Text>

      <FlatList
        data={playlists}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#1DB954"
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No playlists found on your server.
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.playlistCard}
            onPress={() => {
              // Navigating to your dynamic Playlist/Album viewer route
              router.push({
                pathname: "/(tabs)/playlist",
                params: { id: item.id, type: "playlist", name: item.name },
              });
            }}
          >
            <View style={styles.playlistIconContainer}>
              <Text style={styles.playlistIcon}>📁</Text>
            </View>
            <View style={styles.playlistInfo}>
              <Text style={styles.playlistName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.playlistCount}>
                {item.songCount || 0} tracks
              </Text>
            </View>
            <Text style={styles.arrowIcon}>〉</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212", // Matches background colors across your layout
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },
  profileHeader: {
    alignItems: "center",
    marginVertical: 20,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#282828",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    color: "#1DB954",
    fontSize: 32,
    fontWeight: "bold",
  },
  username: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  logoutButton: {
    backgroundColor: "#282828",
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  logoutText: {
    color: "#ff4d4d",
    fontWeight: "600",
    fontSize: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#333",
    marginVertical: 16,
  },
  sectionHeader: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 120, // Prevents elements from overlapping behind GlobalMiniPlayer
  },
  playlistCard: {
    backgroundColor: "#1e1e1e",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  playlistIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: "#282828",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  playlistIcon: {
    fontSize: 24,
  },
  playlistInfo: {
    flex: 1,
    justifyContent: "center",
  },
  playlistName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  playlistCount: {
    color: "#b3b3b3",
    fontSize: 13,
  },
  arrowIcon: {
    color: "#b3b3b3",
    fontSize: 18,
    paddingHorizontal: 8,
  },
  emptyText: {
    color: "#b3b3b3",
    textAlign: "center",
    marginTop: 40,
  },
});
