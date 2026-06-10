// @/Components/ItemLists/SearchPageList.tsx
import { useCallback, useState, useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import {
  Song,
  SharedCollectionData,
  PlaybackContext,
  NavidromeCredentials,
} from "@/Models/Models";
import { searchAll } from "@/Services/navidromeService";
import { ErrorDisplay } from "@/Components/ErrorDisplay";
import { ItemFlatList } from "@/Components/ItemLists/ItemFlatList";
import { useTextInputStore } from "@/Stores/useTextInputStore";

interface SearchPageListProps {
  activeSection: "tracks" | "albums" | "artists";
  navidromeCreds: NavidromeCredentials | null;
  onPlay: (song: Song) => void;
  onOptionsPress?: (song: Song) => void;
  onSwipe: (song: Song) => void;
  context: PlaybackContext;
}

export const SearchPageList = ({
  activeSection,
  navidromeCreds,
  onPlay,
  onOptionsPress,
  onSwipe,
  context,
}: SearchPageListProps) => {
  const query = useTextInputStore((state) => state.texts["search-menu"] || "");
  const [dataStore, setDataStore] = useState<{
    tracks: Song[];
    albums: SharedCollectionData[];
    artists: SharedCollectionData[];
  }>({ tracks: [], albums: [], artists: [] });

  const [loading, setLoading] = useState<boolean>(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  const executeSearch = useCallback(async () => {
    if (!query.trim() || !navidromeCreds) {
      setDataStore({ tracks: [], albums: [], artists: [] });
      setPipelineError(null);
      return;
    }

    setLoading(true);
    setPipelineError(null);

    try {
      const result = await searchAll(navidromeCreds, query);
      setDataStore({
        tracks: result.songs || [],
        albums: result.albums || [],
        artists: result.artists || [],
      });
    } catch (e: any) {
      setPipelineError(
        e.message || "Failed to finalize content search parameters.",
      );
    } finally {
      setLoading(false);
    }
  }, [query, navidromeCreds]);

  // Handle Debounce internally
  useEffect(() => {
    executeSearch();
  }, [query, executeSearch]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  if (pipelineError) {
    return (
      <ErrorDisplay
        title="Search Routine Exception"
        message={pipelineError}
        onRetry={executeSearch}
        retryButtonTitle="Re-run Search Query"
      />
    );
  }

  return (
    <ItemFlatList
      data={dataStore[activeSection]}
      isTracks={activeSection === "tracks"}
      onPlay={onPlay}
      onOptionsPress={onOptionsPress}
      onSwipe={onSwipe}
      context={context}
      windowSize={5}
      ListEmptyComponent={
        query.trim() ? (
          <Text style={styles.emptyText}>No results found for "{query}"</Text>
        ) : (
          <Text style={styles.emptyText}>
            Type something to begin your search.
          </Text>
        )
      }
    />
  );
};

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContainer: { paddingBottom: 100 },
  emptyText: { color: "#b3b3b3", textAlign: "center", marginTop: 40 },
});
