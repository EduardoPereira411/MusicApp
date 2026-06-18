import React, { useState, useEffect, useCallback } from "react";
import { View, ActivityIndicator, FlatList, StyleSheet } from "react-native";
import { downloadService } from "@/Services/downloadService";
import { DownloadAlbumItem } from "@/Components/DownloadAlbumItem";
import { ErrorDisplay } from "@/Components/ItemDisplays/ErrorDisplay";
import { useTextInputStore } from "@/Stores/useTextInputStore";

interface DownloadAlbumsListProps {
  downloadCreds: any;
}

export const DownloadAlbumsList = React.memo(
  ({ downloadCreds }: DownloadAlbumsListProps) => {
    const query = useTextInputStore(
      (state) => state.texts["download-search"] || "",
    );
    const [albums, setAlbums] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAlbums = useCallback(async () => {
      if (!query.trim() || !downloadCreds) {
        setAlbums([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const results = await downloadService.searchAlbums(
          downloadCreds,
          query,
        );
        setAlbums(results);
      } catch (e: any) {
        setError(e.message || "Failed to search remote albums.");
      } finally {
        setLoading(false);
      }
    }, [query, downloadCreds]);

    useEffect(() => {
      fetchAlbums();
    }, [fetchAlbums]);

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
          title="Albums Pipeline Error"
          message={error}
          onRetry={fetchAlbums}
          retryButtonTitle="Retry Search"
        />
      );
    }

    return (
      <FlatList
        data={albums}
        keyExtractor={(item, index) =>
          item.browseId || item.album_id || index.toString()
        }
        renderItem={({ item }) => <DownloadAlbumItem item={item} />}
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
