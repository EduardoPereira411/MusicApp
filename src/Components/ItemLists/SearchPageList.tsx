import React, {
  useCallback,
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import {
  Song,
  SharedCollectionData,
  PlaybackContext,
  NavidromeCredentials,
} from "@/Models/Models";
import { searchAll } from "@/Services/navidromeService";
import { ErrorDisplay } from "@/Components/ItemDisplays/ErrorDisplay";
import { ItemFlatList } from "@/Components/ItemLists/ItemFlatList";
import { useTextInputStore } from "@/Stores/useTextInputStore";
import { useSearchTabStore } from "../Headers/SearchSectionSelector";

interface SearchPageListProps {
  activeSection: "tracks" | "albums" | "artists";
  navidromeCreds: NavidromeCredentials | null;
  onPlay: (song: Song) => void;
  onOptionsPress?: (song: Song) => void;
  onSwipe: (song: Song) => void;
  context: PlaybackContext;
}

const RenderEmptyState = React.memo(({ query }: { query: string }) => {
  if (query.trim()) {
    return <Text style={styles.emptyText}>No results found for "{query}"</Text>;
  }
  return (
    <Text style={styles.emptyText}>Type something to begin your search.</Text>
  );
});

export const SearchPageList = ({
  activeSection,
  navidromeCreds,
  onPlay,
  onOptionsPress,
  onSwipe,
  context,
}: SearchPageListProps) => {
  const query = useTextInputStore((state) => state.texts["search-menu"] || "");
  const globalActiveSection = useSearchTabStore((state) => state.activeSection);

  const lastSearchedQueryRef = useRef<string | null>(null);

  const [dataStore, setDataStore] = useState<{
    tracks: Song[];
    albums: SharedCollectionData[];
    artists: SharedCollectionData[];
  }>({ tracks: [], albums: [], artists: [] });

  const [loading, setLoading] = useState<boolean>(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  const executeSearch = useCallback(async () => {
    if (!query.trim() || !navidromeCreds) {
      setDataStore((prev) => ({ ...prev, [activeSection]: [] }));
      setPipelineError(null);
      return;
    }

    setLoading(true);
    setPipelineError(null);

    try {
      const result = await searchAll(navidromeCreds, query, activeSection);

      setDataStore((prev) => {
        if (activeSection === "tracks") {
          return { ...prev, tracks: result.songs || [] };
        } else if (activeSection === "albums") {
          return { ...prev, albums: result.albums || [] };
        } else if (activeSection === "artists") {
          return { ...prev, artists: result.artists || [] };
        }
        return prev;
      });

      lastSearchedQueryRef.current = query;
    } catch (e: any) {
      setPipelineError(
        e.message || "Failed to finalize content search parameters.",
      );
    } finally {
      setLoading(false);
    }
  }, [query, navidromeCreds, activeSection]);

  useEffect(() => {
    if (activeSection !== globalActiveSection) {
      return;
    }

    if (query !== lastSearchedQueryRef.current) {
      executeSearch();
    }
  }, [query, activeSection, globalActiveSection, executeSearch]);

  const renderEmpty = useMemo(
    () => <RenderEmptyState query={query} />,
    [query],
  );

  if (loading && dataStore[activeSection].length === 0) {
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
      windowSize={11}
      ListEmptyComponent={renderEmpty}
    />
  );
};

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContainer: { paddingBottom: 100 },
  emptyText: { color: "#b3b3b3", textAlign: "center", marginTop: 40 },
});
