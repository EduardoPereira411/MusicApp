import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { useAudioStore } from "@/Stores/useAudioStore";
import { Song, SharedCollectionData } from "@/Models/Models";
import { SongItem } from "@/Components/ItemDisplays/SongItem";
import { SongOptionsModal } from "@/Components/Modals/SongOptionsModal";
import { MediaCollectionItem } from "@/Components/ItemDisplays/MediaCollectionItem";
import { Image } from "expo-image";
import { ErrorDisplay } from "@/Components/ItemDisplays/ErrorDisplay";
import {
  fetchCollectionDetails,
  getArtworkUrl,
} from "@/Services/navidromeService";
import { useSongOptionsStore } from "@/Stores/useSongOptionsStore";

const APP_ICON_FALLBACK = require("@/assets/images/icon.png");

export default function PlaylistScreen() {
  const router = useRouter();
  const { navidromeCreds } = useAuth();
  const { showToast } = useToast();
  const { id, type, name } = useLocalSearchParams<{
    id: string;
    type: "playlist" | "album" | "artist";
    name: string;
  }>();

  const [songs, setSongs] = useState<Song[]>([]);
  const [collections, setCollections] = useState<SharedCollectionData[]>([]);
  const [collectionCoverArt, setCollectionCoverArt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  // Pull stable action methods directly from the state-slice core
  const storePlaySongNow = useAudioStore((state) => state.playSongNow);
  const storeAddToQueue = useAudioStore((state) => state.addToQueue);

  useEffect(() => {
    if (id && type && navidromeCreds) {
      fetchDetails();
    }
  }, [id, type, navidromeCreds]);

  async function fetchDetails() {
    if (!id || !type || !navidromeCreds) return;

    setLoading(true);
    setPipelineError(null);
    try {
      const result = await fetchCollectionDetails(
        navidromeCreds,
        id,
        type,
        name,
      );
      if (type === "artist") {
        setCollections(result.collections || []);
        setSongs([]);
        setCollectionCoverArt("");
      } else {
        setSongs(result.songs || []);
        setCollections([]);
        setCollectionCoverArt(result.coverArt || "");
      }
    } catch (error: any) {
      setPipelineError(
        error.message || `Unable to load resource indices for this ${type}.`,
      );
    } finally {
      setLoading(false);
    }
  }

  const targetCoverArtId = useMemo(() => {
    if (type === "artist" && collections.length > 0) {
      return collections.find((c) => c.coverArt)?.coverArt || "";
    }
    if (collectionCoverArt) {
      return collectionCoverArt;
    }
    if (songs.length > 0 && songs[0].coverArt) {
      return songs[0].coverArt;
    }
    return "";
  }, [type, songs, collections, collectionCoverArt]);

  const headerArtworkSource = useMemo(() => {
    if (!navidromeCreds || !targetCoverArtId) {
      return APP_ICON_FALLBACK;
    }
    const url = getArtworkUrl(navidromeCreds, targetCoverArtId, 300);
    return url ? { uri: url } : APP_ICON_FALLBACK;
  }, [navidromeCreds, targetCoverArtId]);

  const handlePlaySong = useCallback(
    (item: Song, itemIndex: number, contextQueue: Song[] = songs) => {
      storePlaySongNow(
        item,
        contextQueue,
        {
          type: type,
          id: id,
          songIndex: itemIndex,
        },
        showToast,
      ).catch((err) => {
        showToast(err.message || "Failed playback execution.", "error");
      });
    },
    [songs, storePlaySongNow, showToast, type, id],
  );

  const playCollectionStandard = useCallback(() => {
    if (songs.length === 0) return;
    handlePlaySong(songs[0], 0, songs);
  }, [songs, handlePlaySong]);

  const playCollectionShuffled = useCallback(() => {
    if (songs.length === 0) return;

    const shuffledList = [...songs];
    for (let i = shuffledList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledList[i], shuffledList[j]] = [shuffledList[j], shuffledList[i]];
    }
    handlePlaySong(shuffledList[0], 0, shuffledList);
  }, [songs, handlePlaySong]);

  const handleSwipeAddToQueue = useCallback(
    (track: Song, index: number) => {
      storeAddToQueue(track, showToast, {
        type,
        id,
        songIndex: index,
      });
    },
    [storeAddToQueue, showToast, type, id],
  );

  const renderListItem = useCallback(
    ({ item, index }: { item: Song | SharedCollectionData; index: number }) => {
      if (type === "artist") {
        return <MediaCollectionItem item={item as SharedCollectionData} />;
      } else {
        const trackItem = item as Song;

        return (
          <SongItem
            item={trackItem}
            index={index}
            showTrackNumber={true}
            hideArtwork={type === "album"}
            onSwipeLeftToRight={(track) => handleSwipeAddToQueue(track, index)}
            onPlay={(track) => handlePlaySong(track, index, songs)}
            currentContext={{
              type: type,
              id: id,
              songIndex: index,
            }}
          />
        );
      }
    },
    [type, id, handleSwipeAddToQueue, handlePlaySong, songs],
  );

  const keyExtractor = useCallback(
    (item: Song | SharedCollectionData, index: number) => `${item.id}-${index}`,
    [],
  );

  const getHeaderLabel = () => {
    switch (type) {
      case "playlist":
        return "PLAYLIST";
      case "album":
        return "ALBUM";
      case "artist":
        return "ARTIST DISCOGRAPHY";
      default:
        return "COLLECTION";
    }
  };

  const renderListHeader = useMemo(() => {
    return (
      <View style={styles.headerBlock}>
        <View style={styles.artworkWrapper}>
          <Image
            source={headerArtworkSource}
            style={styles.heroArtwork}
            contentFit="cover"
            transition={200}
            cachePolicy="disk"
          />
        </View>

        <Text style={styles.contentTypeLabel}>{getHeaderLabel()}</Text>
        <Text style={styles.headerTitle} numberOfLines={2}>
          {name || "Details"}
        </Text>

        <Text style={styles.headerSubtitle}>
          {type === "artist"
            ? `${collections.length} Cataloged Albums`
            : `${songs.length} Tracks Available`}
        </Text>

        {type !== "artist" && songs.length > 0 && (
          <View style={styles.actionButtonGroup}>
            <TouchableOpacity
              style={[styles.actionButton, styles.playMainButton]}
              onPress={playCollectionStandard}
            >
              <Ionicons
                name="play"
                size={20}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.actionButtonText}>Play</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.shuffleMainButton]}
              onPress={playCollectionShuffled}
            >
              <Ionicons
                name="shuffle"
                size={20}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.actionButtonText}>Shuffle</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }, [
    headerArtworkSource,
    type,
    name,
    collections.length,
    songs.length,
    playCollectionStandard,
    playCollectionShuffled,
  ]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.navigationTopBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList<Song | SharedCollectionData>
        data={pipelineError ? [] : type === "artist" ? collections : songs}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={renderListHeader}
        renderItem={renderListItem}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        ListEmptyComponent={
          pipelineError ? (
            <View style={styles.errorInlineContainer}>
              <ErrorDisplay
                title="Collection Loading Failure"
                message={pipelineError}
                onRetry={fetchDetails}
                retryButtonTitle="Re-fetch Collection Details"
              />
            </View>
          ) : (
            <Text style={styles.emptyText}>
              {type === "artist"
                ? "This artist has no cataloged albums."
                : "This context contains no playable items."}
            </Text>
          )
        }
      />

      <SongOptionsModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },
  navigationTopBar: {
    position: "absolute",
    top: 50,
    left: 16,
    zIndex: 10,
    backgroundColor: "rgba(18, 18, 18, 0.6)",
    borderRadius: 20,
    padding: 4,
  },
  backButton: {
    padding: 6,
  },
  errorInlineContainer: {
    paddingTop: 20,
    paddingHorizontal: 8,
  },
  headerBlock: {
    alignItems: "center",
    paddingTop: 100,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  artworkWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 15,
    marginBottom: 22,
  },
  heroArtwork: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: "#282828",
  },
  contentTypeLabel: {
    color: "#1DB954",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  headerSubtitle: {
    color: "#b3b3b3",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 20,
  },
  actionButtonGroup: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 46,
    paddingHorizontal: 24,
    borderRadius: 24,
    flex: 1,
    maxHeight: 46,
  },
  playMainButton: {
    backgroundColor: "#1DB954",
  },
  shuffleMainButton: {
    backgroundColor: "#282828",
    borderWidth: 1,
    borderColor: "#555",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 150,
  },
  emptyText: {
    color: "#b3b3b3",
    textAlign: "center",
    marginTop: 40,
  },
});
