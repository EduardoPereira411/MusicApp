import React, { useCallback } from "react";
import { FlatList, StyleSheet } from "react-native";
import { Song, SharedCollectionData, PlaybackContext } from "@/Models/Models";
import { SongItem } from "@/Components/SongItem";
import { MediaCollectionItem } from "@/Components/MediaCollectionItem";

interface ItemFlatListProps {
  data: (Song | SharedCollectionData)[];
  isTracks: boolean;
  onPlay: (song: Song, contextSongs?: Song[]) => void;
  onOptionsPress?: (song: Song) => void;
  onSwipe: (song: Song) => void;
  context: PlaybackContext;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  windowSize?: number;
}

export const ItemFlatList = React.memo(
  ({
    data,
    isTracks,
    onPlay,
    onOptionsPress,
    onSwipe,
    context,
    isRefreshing = false,
    onRefresh,
    ListEmptyComponent,
    windowSize = 5,
  }: ItemFlatListProps) => {
    const renderItem = useCallback(
      ({ item }: { item: Song | SharedCollectionData }) => {
        if (isTracks) {
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
      [isTracks, onPlay, onOptionsPress, onSwipe, context],
    );

    return (
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        initialNumToRender={7}
        maxToRenderPerBatch={5}
        windowSize={windowSize}
        removeClippedSubviews={true}
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={ListEmptyComponent}
      />
    );
  },
);

const styles = StyleSheet.create({
  listContainer: { paddingBottom: 120 },
});
