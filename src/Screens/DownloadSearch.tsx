import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { downloadService } from "@/Services/downloadService";
import { DownloadSongItem } from "@/Components/DownloadSongItem";
import { DownloadAlbumItem } from "@/Components/DownloadAlbumItem";
import { SearchBar } from "@/Components/SearchBar";
import { useAuth } from "@/Context/AuthContext";

type SearchType = "tracks" | "albums";

export default function DownloadSearchScreen() {
  const { downloadCreds } = useAuth();

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchType>("tracks");
  const [songs, setSongs] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setSongs([]);
      setAlbums([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      executeDownloadSearch();
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [query, activeTab]);

  async function executeDownloadSearch() {
    if (!query.trim()) return;

    if (!downloadCreds) {
      Alert.alert(
        "Setup Required",
        "Please configure your Download API server credentials in the Profile tab first.",
      );
      return;
    }

    setLoading(true);
    try {
      if (activeTab === "tracks") {
        const results = await downloadService.searchSongs(downloadCreds, query);
        setSongs(results);
      } else {
        const results = await downloadService.searchAlbums(
          downloadCreds,
          query,
        );
        setAlbums(results);
      }
    } catch (e) {
      console.error("Download server search failed:", e);
    } finally {
      setLoading(false);
    }
  }

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      if (activeTab === "tracks") {
        return <DownloadSongItem item={item} />;
      } else {
        return <DownloadAlbumItem item={item} />;
      }
    },
    [activeTab],
  );

  const keyExtractor = useCallback((item: any, index: number) => {
    return (
      item.download_url || item.browseId || item.album_id || index.toString()
    );
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Download Music</Text>
      <Text style={styles.subHeader}>
        Search & import tracks directly into your server
      </Text>

      <SearchBar
        placeholder="Search YouTube Music..."
        value={query}
        onChangeText={setQuery}
      />

      <View style={styles.tabBar}>
        {(["tracks", "albums"] as SearchType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              activeTab === tab && styles.tabButtonActive,
            ]}
            onPress={() => {
              setSongs([]);
              setAlbums([]);
              setActiveTab(tab);
            }}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab && styles.tabButtonTextActive,
              ]}
            >
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#1DB954" />
          </View>
        ) : (
          <FlatList
            data={activeTab === "tracks" ? songs : albums}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            initialNumToRender={8}
            maxToRenderPerBatch={5}
            windowSize={3}
            removeClippedSubviews={true}
          />
        )}
      </View>
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
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  subHeader: {
    color: "#666",
    fontSize: 13,
    marginBottom: 16,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: "#282828",
  },
  tabButtonText: {
    color: "#888888",
    fontSize: 12,
    fontWeight: "bold",
  },
  tabButtonTextActive: {
    color: "#00A3FF",
  },
});
