import React, { useCallback, useState, useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Song, PlaybackContext, NavidromeCredentials } from "@/Models/Models";
import {
  fetchTracks,
  fetchAlbums,
  fetchArtists,
} from "@/Services/navidromeService";
import { ErrorDisplay } from "@/Components/ItemDisplays/ErrorDisplay";
import { ItemFlatList } from "@/Components/ItemLists/ItemFlatList";

interface HomepageListProps {
  activeSection: "tracks" | "albums" | "artists";
  onPlay: (song: Song, contextSongs?: Song[]) => void;
  navidromeCreds: NavidromeCredentials | null;
  onOptionsPress?: (song: Song) => void;
  onSwipe: (song: Song) => void;
  context: PlaybackContext;
}

export const HomepageList = ({
  activeSection,
  onPlay,
  navidromeCreds,
  onOptionsPress,
  onSwipe,
  context,
}: HomepageListProps) => {
  const [dataStore, setDataStore] = useState<{
    tracks: Song[];
    albums: any[];
    artists: any[];
  }>({ tracks: [], albums: [], artists: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (section: typeof activeSection) => {
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
    let isMounted = true;
    const init = async () => {
      setLoading(true);
      await fetchData(activeSection);
      if (isMounted) setLoading(false);
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [fetchData, activeSection]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData(activeSection);
    setIsRefreshing(false);
  }, [activeSection, fetchData]);

  if (loading)
    return <ActivityIndicator style={{ marginTop: 40 }} color="#1DB954" />;

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <ErrorDisplay
          title="Synchronization Interrupted"
          message={error}
          onRetry={handleRefresh}
          retryButtonTitle="Re-sync Pipeline"
        />
      </View>
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
      isRefreshing={isRefreshing}
      onRefresh={handleRefresh}
      windowSize={5}
    />
  );
};

const styles = StyleSheet.create({
  errorContainer: { marginTop: 40, paddingHorizontal: 20 },
});
