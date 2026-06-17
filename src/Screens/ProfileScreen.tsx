import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/Context/AuthContext";
import { useAudioActions } from "@/Stores/useAudioStore";
import { fetchNavidromePlaylists } from "@/Services/navidromeService";
import { MediaCollectionItem } from "@/Components/ItemDisplays/MediaCollectionItem";
import { SharedCollectionData } from "@/Models/Models";
import { ErrorDisplay } from "@/Components/ItemDisplays/ErrorDisplay";
import { DownloadConfigSection } from "@/Components/Optimized/DownloadConfigSection";

export default function ProfileScreen() {
  const router = useRouter();
  const { navidromeCreds, logout } = useAuth();
  const { logoutCleanUp } = useAudioActions();

  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  const username = navidromeCreds?.username || "";

  const loadPlaylists = useCallback(async () => {
    if (!navidromeCreds) return;
    setPipelineError(null);
    try {
      const list = await fetchNavidromePlaylists(navidromeCreds);
      setPlaylists(list);
    } catch (e: any) {
      setPipelineError(e.message || "Failed to load account user playlists.");
    }
  }, [navidromeCreds]);

  useEffect(() => {
    if (!navidromeCreds) return;

    async function loadInitialPlaylists() {
      setLoading(true);
      await loadPlaylists();
      setLoading(false);
    }
    loadInitialPlaylists();
  }, [navidromeCreds, loadPlaylists]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    await loadPlaylists();
    setLoading(false);
  }, [loadPlaylists]);

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

  const renderHeader = useMemo(() => {
    return (
      <View>
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

        <DownloadConfigSection />

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
    );
  }, [username, handleLogout, pipelineError, handleRefresh]);

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
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !pipelineError ? (
            <Text style={styles.emptyText}>
              No playlists found on your server.
            </Text>
          ) : null
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
