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
  ({ data, isTracks, windowSize = 5 }: DownloadItemFlatListProps) => {
    const renderItem = useCallback(
      ({ item }: { item: DownloadTrackMetadata | DownloadAlbumMetadata }) => {
        if (isTracks) {
          return <DownloadSongItem item={item as DownloadTrackMetadata} />;
        }
        return <DownloadAlbumItem item={item as DownloadAlbumMetadata} />;
      },
      [isTracks],
    );

    return (
      <FlatList
        data={data}
        keyExtractor={(item, index) => {
          return (
            (item as any).download_url ||
            (item as any).album_id ||
            (item as any).browseId ||
            index.toString()
          );
        }}
        renderItem={renderItem}
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
