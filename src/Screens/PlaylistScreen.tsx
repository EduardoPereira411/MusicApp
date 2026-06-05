import { useState, useEffect, useCallback, useMemo } from "react";
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
import { fetchCollectionDetails } from "@/Services/navidromeService";
import { useAudio } from "@/Context/AudioContext";
import { Song, SharedCollectionData } from "@/Models/Models";
import { SongItem } from "@/Components/SongItem";
import { SongOptionsModal } from "@/Components/SongOptionsModal";
import { MediaCollectionItem } from "@/Components/MediaCollectionItem";
import { Image } from "expo-image";
import { useArtwork } from "@/CustomHooks/useArtwork";
import { ErrorDisplay } from "@/Components/ErrorDisplay";

const APP_ICON_FALLBACK = require("@/assets/images/icon.png");

export default function PlaylistScreen() {
  const router = useRouter();
  const { navidromeCreds } = useAuth();
  const { id, type, name } = useLocalSearchParams<{
    id: string;
    type: "playlist" | "album" | "artist";
    name: string;
  }>();

  const [songs, setSongs] = useState<Song[]>([]);
  const [collections, setCollections] = useState<SharedCollectionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const { currentSong, playing, playSongNow, addToQueue } = useAudio();

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
      } else {
        setSongs(result.songs || []);
        setCollections([]);
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
    if (songs.length > 0 && songs[0].coverArt) {
      return songs[0].coverArt;
    }
    return "";
  }, [type, songs, collections]);

  const { url: resolvedArtworkUrl } = useArtwork(targetCoverArtId, 400);

  const headerArtworkSource = useMemo(() => {
    if (resolvedArtworkUrl) {
      return { uri: resolvedArtworkUrl };
    }
    return APP_ICON_FALLBACK;
  }, [resolvedArtworkUrl]);

  const handlePlaySong = useCallback(
    (item: Song, contextQueue: Song[] = songs) => {
      playSongNow(item, contextQueue).catch((err) => {
        console.error("Collection streaming execution exception:", err);
      });
    },
    [songs, playSongNow],
  );

  const playCollectionStandard = useCallback(() => {
    if (songs.length === 0) return;
    handlePlaySong(songs[0], songs);
  }, [songs, handlePlaySong]);

  const playCollectionShuffled = useCallback(() => {
    if (songs.length === 0) return;

    const shuffledList = [...songs];
    for (let i = shuffledList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledList[i], shuffledList[j]] = [shuffledList[j], shuffledList[i]];
    }

    handlePlaySong(shuffledList[0], shuffledList);
  }, [songs, handlePlaySong]);

  const handleSongOptions = useCallback((song: Song) => {
    setSelectedSong(song);
    setIsModalVisible(true);
  }, []);

  const renderListItem = useCallback(
    ({ item, index }: { item: Song | SharedCollectionData; index: number }) => {
      if (type === "artist") {
        return <MediaCollectionItem item={item as SharedCollectionData} />;
      } else {
        const trackItem = item as Song;
        const isCurrent = currentSong?.id === trackItem.id;
        return (
          <SongItem
            item={trackItem}
            index={index}
            showTrackNumber={true}
            isCurrent={isCurrent}
            isPlaying={isCurrent && playing}
            onOptionsPress={handleSongOptions}
            onSwipeLeftToRight={addToQueue}
            onPlay={(track) => handlePlaySong(track, songs)}
          />
        );
      }
    },
    [
      type,
      currentSong?.id,
      playing,
      handleSongOptions,
      addToQueue,
      handlePlaySong,
      songs,
    ],
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

      <View style={styles.errorOffsetContainer}>
        <ErrorDisplay
          title="Collection Loading Failure"
          message={pipelineError}
          onRetry={fetchDetails}
          retryButtonTitle="Re-fetch Collection Details"
        />
      </View>

      <FlatList<Song | SharedCollectionData>
        data={type === "artist" ? collections : songs}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={renderListHeader}
        renderItem={renderListItem}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        ListEmptyComponent={
          !pipelineError ? (
            <Text style={styles.emptyText}>
              {type === "artist"
                ? "This artist has no cataloged albums."
                : "This context contains no playable items."}
            </Text>
          ) : null
        }
      />

      <SongOptionsModal
        visible={isModalVisible}
        song={selectedSong}
        onClose={() => setIsModalVisible(false)}
        onAddToQueue={addToQueue}
      />
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
  errorOffsetContainer: {
    paddingTop: 100,
    paddingHorizontal: 16,
  },
  headerBlock: {
    alignItems: "center",
    paddingTop: 20,
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
