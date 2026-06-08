import React, { useCallback, useState, useEffect } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import {
  Song,
  SharedCollectionData,
  PlaybackContext,
  NavidromeCredentials,
} from "@/Models/Models";
import { SongItem } from "@/Components/SongItem";
import { MediaCollectionItem } from "@/Components/MediaCollectionItem";
import {
  fetchTracks,
  fetchAlbums,
  fetchArtists,
} from "@/Services/navidromeService";
import { ErrorDisplay } from "@/Components/ErrorDisplay";

interface Props {
  activeSection: "tracks" | "albums" | "artists";
  onPlay: (song: Song, contextSongs?: Song[]) => void;
  navidromeCreds: NavidromeCredentials | null;
  onOptionsPress: (song: Song) => void;
  onSwipe: (song: Song) => void;
  context: PlaybackContext;
}

export const ItemFlatList = React.memo(
  ({
    activeSection,
    onPlay,
    navidromeCreds,
    onOptionsPress,
    onSwipe,
    context,
  }: Props) => {
    const [dataStore, setDataStore] = useState<{
      tracks: Song[];
      albums: SharedCollectionData[];
      artists: SharedCollectionData[];
    }>({ tracks: [], albums: [], artists: [] });
    const [loading, setLoading] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(
      async (section: "tracks" | "albums" | "artists") => {
        if (!navidromeCreds) return;
        setError(null);
        try {
          if (section === "tracks") {
            const data = await fetchTracks(navidromeCreds);
            setDataStore((prev) => ({ ...prev, tracks: data }));
          } else if (section === "albums") {
            const data = await fetchAlbums(navidromeCreds);
            setDataStore((prev) => ({ ...prev, albums: data }));
          } else {
            const data = await fetchArtists(navidromeCreds);
            setDataStore((prev) => ({ ...prev, artists: data }));
          }
        } catch (e: any) {
          setDataStore((prev) => ({ ...prev, [section]: [] }));
          setError(e.message || "An unexpected error occurred.");
        }
      },
      [navidromeCreds],
    );

    useEffect(() => {
      const initSingleSection = async () => {
        setLoading(true);
        await fetchData(activeSection);
        setLoading(false);
      };

      initSingleSection();
    }, [fetchData, activeSection]);

    const handleRefresh = useCallback(async () => {
      setIsRefreshing(true);
      await fetchData(activeSection);
      setIsRefreshing(false);
    }, [activeSection, fetchData]);

    const renderItem = useCallback(
      ({ item }: { item: Song | SharedCollectionData }) => {
        if (activeSection === "tracks") {
          return (
            <SongItem
              item={item as Song}
              onPlay={onPlay}
              onOptionsPress={onOptionsPress}
              currentContext={context}
              onSwipeLeftToRight={onSwipe}
            />
          );
        }
        return <MediaCollectionItem item={item as SharedCollectionData} />;
      },
      [activeSection, onPlay, onOptionsPress, onSwipe, context],
    );

    const activeData = dataStore[activeSection];

    if (loading)
      return <ActivityIndicator style={{ marginTop: 40 }} color="#1DB954" />;

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <ErrorDisplay
            title="Synchronization Point Interrupted"
            message={error}
            onRetry={handleRefresh}
            retryButtonTitle="Re-sync Pipeline"
          />
        </View>
      );
    }
    return (
      <FlatList
        data={activeData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        initialNumToRender={7}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
    );
  },
);

const styles = StyleSheet.create({
  listContainer: { paddingBottom: 120 },
  errorContainer: { marginTop: 40, paddingHorizontal: 20 },
});
