import { useCallback, useState, useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { DownloadTrackMetadata, DownloadAlbumMetadata } from "@/Models/Models";
import { downloadService } from "@/Services/downloadService";
import { ErrorDisplay } from "@/Components/ItemDisplays/ErrorDisplay";
import { useTextInputStore } from "@/Stores/useTextInputStore";
import { DownloadItemFlatList } from "@/Components/ItemLists/DownloadItemFlatList";
import { useDownloadTabStore } from "@/Components/Headers/DownloadSectionSelector";

interface DownloadPageListProps {
  activeSection: "tracks" | "albums" | "artists" | "videos";
  downloadCreds: any;
}

export const DownloadPageList = ({
  activeSection,
  downloadCreds,
}: DownloadPageListProps) => {
  const query = useTextInputStore(
    (state) => state.texts["download-search"] || "",
  );

  const globalActiveSection = useDownloadTabStore(
    (state) => state.activeSection,
  );

  const [dataStore, setDataStore] = useState<{
    tracks: DownloadTrackMetadata[];
    albums: DownloadAlbumMetadata[];
    artists: any[];
    videos: any[];
  }>({ tracks: [], albums: [], artists: [], videos: [] });

  const [loading, setLoading] = useState<boolean>(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  const executeSearch = useCallback(async () => {
    if (activeSection !== globalActiveSection) {
      return;
    }

    if (!query.trim() || !downloadCreds) {
      return;
    }

    setLoading(true);
    setPipelineError(null);

    try {
      if (activeSection === "tracks") {
        const results = await downloadService.searchSongs(downloadCreds, query);
        setDataStore((prev) => ({ ...prev, tracks: results || [] }));
      } else if (activeSection === "albums") {
        const results = await downloadService.searchAlbums(
          downloadCreds,
          query,
        );
        setDataStore((prev) => ({ ...prev, albums: results || [] }));
      }
    } catch (e: any) {
      setPipelineError(
        e.message || `Failed to search remote ${activeSection}.`,
      );
    } finally {
      setLoading(false);
    }
  }, [query, downloadCreds, activeSection, globalActiveSection]);

  useEffect(() => {
    executeSearch();
  }, [query, activeSection, globalActiveSection, executeSearch]);

  if (loading && dataStore[activeSection].length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00A3FF" />
      </View>
    );
  }

  if (pipelineError) {
    return (
      <ErrorDisplay
        title="Download Pipeline Error"
        message={pipelineError}
        onRetry={executeSearch}
        retryButtonTitle="Retry Search"
      />
    );
  }

  return (
    <DownloadItemFlatList
      data={dataStore[activeSection]}
      isTracks={activeSection === "tracks"}
      windowSize={11}
      ListEmptyComponent={
        query.trim() ? (
          <Text style={styles.emptyText}>No results found for "{query}"</Text>
        ) : (
          <Text style={styles.emptyText}>
            Type something to search YouTube Music.
          </Text>
        )
      }
    />
  );
};

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#b3b3b3", textAlign: "center", marginTop: 40 },
});
