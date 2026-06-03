import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
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

type SearchType = "tracks" | "albums";

export default function DownloadSearchScreen() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchType>("tracks");
  const [songs, setSongs] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search trigger
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
  }, [query, activeTab]); // Re-run search if tab changes while query exists

  async function executeDownloadSearch() {
    if (!query.trim()) return;
    setLoading(true);

    try {
      if (activeTab === "tracks") {
        const results = await downloadService.searchSongs(query);
        setSongs(results);
      } else {
        const results = await downloadService.searchAlbums(query);
        setAlbums(results);
      }
    } catch (e) {
      console.error("Download server search failed:", e);
    } finally {
      setLoading(false);
    }
  }

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
            keyExtractor={(item, index) =>
              item.download_url ||
              item.browseId ||
              item.album_id ||
              index.toString()
            }
            renderItem={({ item }) => {
              if (activeTab === "tracks") {
                return <DownloadSongItem item={item} />;
              } else {
                return <DownloadAlbumItem item={item} />;
              }
            }}
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
  searchBarContainer: {
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: {
    color: "#fff",
    fontSize: 16,
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
    color: "#00A3FF", // Distinct cyan/blue coloring to separate it visually from Navidrome Green
  },
  listContainer: {
    paddingBottom: 100,
  },
  emptyText: {
    color: "#b3b3b3",
    textAlign: "center",
    marginTop: 40,
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  downloadButton: {
    backgroundColor: "#00A3FF",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginLeft: 10,
    minWidth: 55,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#444",
  },
  downloadButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
});
