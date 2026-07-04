import React, { useCallback } from "react";
import { FlatList, StyleSheet } from "react-native";
import { DownloadTrackMetadata, DownloadAlbumMetadata } from "@/Models/Models";
import { DownloadSongItem } from "@/Components/ItemDisplays/DownloadSongItem";
import { DownloadAlbumItem } from "@/Components/ItemDisplays/DownloadAlbumItem";

interface DownloadItemFlatListProps {
  data: (DownloadTrackMetadata | DownloadAlbumMetadata)[];
  isTracks: boolean;
  windowSize?: number;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
}

export const DownloadItemFlatList = React.memo(
  ({
    data,
    isTracks,
    windowSize = 5,
    ListEmptyComponent,
  }: DownloadItemFlatListProps) => {
    const renderItem = useCallback(
      ({ item }: { item: DownloadTrackMetadata | DownloadAlbumMetadata }) => {
        if (isTracks) {
          return (
            <DownloadSongItem
              item={item as DownloadTrackMetadata}
              autocompleteOnDownload={isTracks}
              getLyricsOnDownload={isTracks}
            />
          );
        }
        return <DownloadAlbumItem item={item as DownloadAlbumMetadata} />;
      },
      [isTracks],
    );

    return (
      <FlatList
        data={data}
        keyExtractor={(item, index) => {
          if (isTracks) {
            return (item as DownloadTrackMetadata).video_id || index.toString();
          }
          return (item as DownloadAlbumMetadata).album_id || index.toString();
        }}
        renderItem={renderItem}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={styles.listContainer}
        initialNumToRender={8}
        maxToRenderPerBatch={5}
        windowSize={windowSize}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={false}
      />
    );
  },
);

const styles = StyleSheet.create({
  listContainer: { paddingBottom: 120 },
});
