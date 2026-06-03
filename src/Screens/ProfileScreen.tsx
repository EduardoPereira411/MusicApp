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
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import {
  authStorage,
  fetchNavidromePlaylists,
} from "@/Services/navidromeService";
import { downloadAuthStorage } from "@/Services/downloadService";

export default function ProfileScreen() {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");

  // Download API Form State
  const [showDlConfig, setShowDlConfig] = useState<boolean>(false);
  const [dlBaseUrl, setDlBaseUrl] = useState<string>("");
  const [dlUsername, setDlUsername] = useState<string>("");
  const [dlPassword, setDlPassword] = useState<string>("");
  const [isSavingDl, setIsSavingDl] = useState<boolean>(false);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    setLoading(true);

    // Fetch Navidrome details
    const creds = await authStorage.getCredentials();
    if (creds?.username) {
      setUsername(creds.username);
    }

    // Fetch existing Download API configurations if present
    const dlCreds = await downloadAuthStorage.getCredentials();
    if (dlCreds) {
      setDlBaseUrl(dlCreds.baseUrl);
      setDlUsername(dlCreds.user || "");
      setDlPassword(dlCreds.pass || "");
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

  async function handleSaveDownloadConfig() {
    if (!dlBaseUrl) {
      Alert.alert("Error", "Proxy Base URL is required.");
      return;
    }

    setIsSavingDl(true);
    try {
      await downloadAuthStorage.saveCredentials({
        baseUrl: dlBaseUrl,
        user: dlUsername || undefined,
        pass: dlPassword || undefined,
      });
      Alert.alert("Success", "Download API settings updated successfully!");
      setShowDlConfig(false);
    } catch (error) {
      console.error("Failed to save download proxy options:", error);
      Alert.alert("Error", "Could not save settings securely.");
    } finally {
      setIsSavingDl(false);
    }
  }

  async function handleClearDownloadConfig() {
    Alert.alert(
      "Remove Configuration",
      "Are you sure you want to delete your Download API setup?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await downloadAuthStorage.clearCredentials();
            setDlBaseUrl("");
            setDlUsername("");
            setDlPassword("");
            setShowDlConfig(false);
            Alert.alert("Cleared", "Proxy configuration has been removed.");
          },
        },
      ],
    );
  }

  async function handleLogout() {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await authStorage.clearCredentials();
          await downloadAuthStorage.clearCredentials();
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
      <FlatList
        data={playlists}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View>
            <View style={styles.profileHeader}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {username ? username.charAt(0).toUpperCase() : "U"}
                </Text>
              </View>
              <Text style={styles.username}>{username || "User Profile"}</Text>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Text style={styles.logoutText}>Log Out</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setShowDlConfig(!showDlConfig)}
            >
              <Text style={styles.toggleText}>
                {showDlConfig
                  ? "▼ Hide Download Proxy Setup"
                  : "▶ Manage Download Proxy API"}
              </Text>
            </TouchableOpacity>

            {showDlConfig && (
              <View style={styles.configContainer}>
                <Text style={styles.configLabel}>Base URL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://your-proxy-domain.com"
                  placeholderTextColor="#888"
                  value={dlBaseUrl}
                  onChangeText={setDlBaseUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />

                <Text style={styles.configLabel}>Username (Basic Auth)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Optional proxy access list user"
                  placeholderTextColor="#888"
                  value={dlUsername}
                  onChangeText={setDlUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text style={styles.configLabel}>Password (Basic Auth)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Optional proxy access list password"
                  placeholderTextColor="#888"
                  secureTextEntry
                  value={dlPassword}
                  onChangeText={setDlPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={handleSaveDownloadConfig}
                    disabled={isSavingDl}
                  >
                    {isSavingDl ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.actionButtonText}>Save Proxy</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.clearButton]}
                    onPress={handleClearDownloadConfig}
                  >
                    <Text style={styles.clearButtonText}>Clear Proxy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.divider} />

            <Text style={styles.sectionHeader}>Your Playlists</Text>
          </View>
        }
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
              router.push({
                pathname: "/playlist",
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
            <Text style={styles.arrowIcon}>〉</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
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
  toggleRow: {
    paddingVertical: 12,
  },
  toggleText: {
    color: "#1DB954",
    fontSize: 15,
    fontWeight: "600",
  },
  configContainer: {
    backgroundColor: "#1e1e1e",
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  configLabel: {
    color: "#b3b3b3",
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#282828",
    color: "#fff",
    padding: 12,
    borderRadius: 6,
    marginBottom: 14,
    fontSize: 15,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  actionButton: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    backgroundColor: "#1DB954",
  },
  clearButton: {
    backgroundColor: "#282828",
    borderWidth: 1,
    borderColor: "#444",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  clearButtonText: {
    color: "#ff4d4d",
    fontWeight: "bold",
    fontSize: 14,
  },
  sectionHeader: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 120,
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
