import { useState, useEffect, useCallback, useMemo } from "react";
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
import { useAuth } from "@/Context/AuthContext";
import { useAudioStore } from "@/Stores/useAudioStore";
import { useTextInputStore } from "@/Stores/useTextInputStore";
import { fetchNavidromePlaylists } from "@/Services/navidromeService";
import { MediaCollectionItem } from "@/Components/ItemDisplays/MediaCollectionItem";
import { SharedCollectionData } from "@/Models/Models";
import { ErrorDisplay } from "@/Components/ItemDisplays/ErrorDisplay";
import IndependentUpdateTextInput from "@/Components/TextInputs/IndependentUpdateTextInput";

export default function ProfileScreen() {
  const router = useRouter();
  const { navidromeCreds, downloadCreds, logout, setDownloadAuth } = useAuth();
  const logoutCleanUp = useAudioStore((state) => state.logoutCleanUp);
  const setStoreText = useTextInputStore((state) => state.setTexts);

  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [showDlConfig, setShowDlConfig] = useState<boolean>(false);
  const [isSavingDl, setIsSavingDl] = useState<boolean>(false);

  const username = navidromeCreds?.username || "";

  useEffect(() => {
    if (downloadCreds) {
      setStoreText("dlBaseUrl", downloadCreds.serverUrl || "");
      setStoreText("dlUsername", downloadCreds.username || "");
      setStoreText("dlPassword", downloadCreds.password || "");
    }
  }, [downloadCreds, setStoreText]);

  useEffect(() => {
    if (!navidromeCreds) return;

    async function loadInitialPlaylists() {
      setLoading(true);
      await loadPlaylists();
      setLoading(false);
    }
    loadInitialPlaylists();
  }, [navidromeCreds]);

  async function loadPlaylists() {
    if (!navidromeCreds) return;
    setPipelineError(null);
    try {
      const list = await fetchNavidromePlaylists(navidromeCreds);
      setPlaylists(list);
    } catch (e: any) {
      setPipelineError(e.message || "Failed to load account user playlists.");
    }
  }

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadPlaylists();
    setIsRefreshing(false);
  }, [navidromeCreds]);

  const handleSaveDownloadConfig = useCallback(async () => {
    const currentTexts = useTextInputStore.getState().texts;
    const url = currentTexts["dlBaseUrl"] || "";
    const user = currentTexts["dlUsername"] || "";
    const pass = currentTexts["dlPassword"] || "";

    if (!url) {
      Alert.alert("Error", "Proxy Base URL is required.");
      return;
    }

    setIsSavingDl(true);
    try {
      await setDownloadAuth({
        serverUrl: url,
        username: user || undefined,
        password: pass || undefined,
      });
      Alert.alert("Success", "Download API settings updated successfully!");
      setShowDlConfig(false);
    } catch (error) {
      Alert.alert("Error", "Could not save settings securely.");
    } finally {
      setIsSavingDl(false);
    }
  }, [setDownloadAuth]);

  const handleClearDownloadConfig = useCallback(async () => {
    Alert.alert(
      "Remove Configuration",
      "Are you sure you want to delete your Download API setup?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await setDownloadAuth(null);
            // Clear the global store fields
            setStoreText("dlBaseUrl", "");
            setStoreText("dlUsername", "");
            setStoreText("dlPassword", "");
            setShowDlConfig(false);
            Alert.alert("Cleared", "Proxy configuration has been removed.");
          },
        },
      ],
    );
  }, [setDownloadAuth, setStoreText]);

  const handleLogout = useCallback(async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          logoutCleanUp();
          await logout();
          router.replace("/login");
        },
      },
    ]);
  }, [router, logout, logoutCleanUp]);

  const formattedPlaylists = useMemo<SharedCollectionData[]>(() => {
    return playlists.map((pl) => ({
      id: pl.id,
      name: pl.name,
      type: "playlist",
      coverArt: pl.coverArt,
      subtitle: pl.subtitle || "Unknown Owner",
      subItemCount: pl.subItemCount || 0,
    }));
  }, [playlists]);

  const renderItem = useCallback(
    ({ item }: { item: SharedCollectionData }) => (
      <MediaCollectionItem item={item} />
    ),
    [],
  );

  const keyExtractor = useCallback((item: SharedCollectionData) => item.id, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList<SharedCollectionData>
        data={formattedPlaylists}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#1DB954"
          />
        }
        ListEmptyComponent={
          !pipelineError ? (
            <Text style={styles.emptyText}>
              No playlists found on your server.
            </Text>
          ) : null
        }
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
                <IndependentUpdateTextInput
                  textId="dlBaseUrl"
                  placeholder="https://your-proxy-domain.com"
                  autoCapitalize="none"
                  containerStyle={styles.input}
                  keyboardType="url"
                />

                <Text style={styles.configLabel}>Username (Basic Auth)</Text>
                <IndependentUpdateTextInput
                  textId="dlUsername"
                  placeholder="Optional proxy access list user"
                  autoCapitalize="none"
                  containerStyle={styles.input}
                />

                <Text style={styles.configLabel}>Password (Basic Auth)</Text>
                <IndependentUpdateTextInput
                  textId="dlPassword"
                  placeholder="Optional proxy access list password"
                  secureTextEntry
                  autoCapitalize="none"
                  containerStyle={styles.input}
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

            {pipelineError && (
              <ErrorDisplay
                title="Playlist Service Sync Error"
                message={pipelineError}
                onRetry={handleRefresh}
                retryButtonTitle="Re-sync Playlists"
              />
            )}

            <Text style={styles.sectionHeader}>Your Playlists</Text>
          </View>
        }
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
    backgroundColor: "#363636",
    color: "#fff",
    borderRadius: 6,
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
  emptyText: {
    color: "#b3b3b3",
    textAlign: "center",
    marginTop: 40,
  },
});
