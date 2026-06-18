import React, { useState, useEffect, useCallback } from "react";
import { View, ActivityIndicator, FlatList, StyleSheet } from "react-native";
import { downloadService } from "@/Services/downloadService";
import { DownloadSongItem } from "@/Components/DownloadSongItem";
import { ErrorDisplay } from "@/Components/ItemDisplays/ErrorDisplay";
import { useTextInputStore } from "@/Stores/useTextInputStore";

interface DownloadTracksListProps {
  downloadCreds: any;
}

export const DownloadTracksList = React.memo(
  ({ downloadCreds }: DownloadTracksListProps) => {
    const query = useTextInputStore(
      (state) => state.texts["download-search"] || "",
    );
    const [songs, setSongs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTracks = useCallback(async () => {
      if (!query.trim() || !downloadCreds) {
        setSongs([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const results = await downloadService.searchSongs(downloadCreds, query);
        setSongs(results);
      } catch (e: any) {
        setError(e.message || "Failed to search remote tracks.");
      } finally {
        setLoading(false);
      }
    }, [query, downloadCreds]);

    useEffect(() => {
      fetchTracks();
    }, [fetchTracks]);

    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
        </View>
      );
    }

    if (error) {
      return (
        <ErrorDisplay
          title="Tracks Pipeline Error"
          message={error}
          onRetry={fetchTracks}
          retryButtonTitle="Retry Search"
        />
      );
    }

    return (
      <FlatList
        data={songs}
        keyExtractor={(item, index) => item.download_url || index.toString()}
        renderItem={({ item }) => <DownloadSongItem item={item} />}
        initialNumToRender={8}
        maxToRenderPerBatch={5}
        windowSize={3}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={false}
      />
    );
  },
);

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});
