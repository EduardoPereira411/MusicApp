import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useUiStore } from "@/Stores/useUIStore";
import { useCurrentSong, useAudioCurrentTime } from "@/Stores/useAudioStore";
import { useAuth } from "@/Context/AuthContext";
import { fetchSongLyrics } from "@/Services/navidromeService";
import { SongLyricsData, LyricLine as LyricLineType } from "@/Models/Models";

const LyricLine = React.memo(
  ({
    line,
    isActive,
    onLayout,
  }: {
    line: LyricLineType;
    isActive: boolean;
    onLayout: (e: any) => void;
  }) => {
    return (
      <Text
        style={[styles.lyricLine, isActive && styles.activeLyricLine]}
        onLayout={onLayout}
      >
        {line.value || "🎵"}
      </Text>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.isActive === nextProps.isActive &&
      prevProps.line.value === nextProps.line.value
    );
  },
);

function AudioTimeTracker({
  lines,
  activeIndex,
  onActiveIndexChange,
}: {
  lines: LyricLineType[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
}) {
  const liveSeconds = useAudioCurrentTime();
  const currentPlaybackMs = liveSeconds * 1000;

  useEffect(() => {
    if (lines.length === 0) return;

    let indexToHighlight = -1;
    for (let i = 0; i < lines.length; i++) {
      const lineStart = lines[i].start;
      if (lineStart !== undefined && currentPlaybackMs >= lineStart) {
        indexToHighlight = i;
      } else {
        break;
      }
    }

    if (indexToHighlight !== activeIndex && indexToHighlight !== -1) {
      onActiveIndexChange(indexToHighlight);
    }
  }, [currentPlaybackMs, lines, activeIndex, onActiveIndexChange]);

  return null;
}

function LyricsContent({ lyricsData }: { lyricsData: SongLyricsData }) {
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [containerHeight, setContainerHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const lineLayouts = useRef<{ [key: number]: { y: number; height: number } }>(
    {},
  );

  // Center active item when activeIndex changes
  useEffect(() => {
    if (activeIndex === -1 || containerHeight === 0) return;

    const layout = lineLayouts.current[activeIndex];
    if (layout) {
      const scrollTarget = Math.max(
        0,
        layout.y - containerHeight / 2 + layout.height / 2,
      );

      scrollViewRef.current?.scrollTo({
        y: scrollTarget,
        animated: true,
      });
    }
  }, [activeIndex, containerHeight]);

  return (
    <>
      {lyricsData.synced && (
        <AudioTimeTracker
          lines={lyricsData.lines}
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
        />
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.lyricsContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
      >
        <Text style={styles.syncType}>
          Format discovered: {lyricsData.synced ? "Synced (LRC)" : "Plain Text"}
        </Text>

        {lyricsData.lines.map((line, index) => (
          <LyricLine
            key={index}
            line={line}
            isActive={index === activeIndex}
            onLayout={(e) => {
              lineLayouts.current[index] = {
                y: e.nativeEvent.layout.y,
                height: e.nativeEvent.layout.height,
              };
            }}
          />
        ))}
      </ScrollView>
    </>
  );
}

export function LyricsModal() {
  const isOpen = useUiStore((state) => !!state.modals["lyrics"]);
  const closeModal = useUiStore((state) => state.closeModal);
  const currentSong = useCurrentSong();
  const { navidromeCreds } = useAuth();

  const [loading, setLoading] = useState(false);
  const [lyricsData, setLyricsData] = useState<SongLyricsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !currentSong || !navidromeCreds) return;

    const activeSong = currentSong;
    const activeCreds = navidromeCreds;

    async function loadLyrics() {
      setLoading(true);
      setError(null);
      setLyricsData(null);
      try {
        const res = await fetchSongLyrics(activeCreds, activeSong.id);
        if (res) {
          setLyricsData(res);
        } else {
          setError("No lyrics found in the tags for this track.");
        }
      } catch (err: any) {
        setError(err?.message || "Failed to fetch lyrics");
      } finally {
        setLoading(false);
      }
    }

    loadLyrics();
  }, [isOpen, currentSong, navidromeCreds]);

  if (!isOpen || !currentSong) return null;

  return (
    <Modal visible={isOpen} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Lyrics</Text>
          <Text style={styles.songMeta}>
            {currentSong.title} - {currentSong.artist}
          </Text>

          <View style={styles.divider} />

          {loading && (
            <ActivityIndicator
              size="large"
              color="#1DB954"
              style={{ margin: 20 }}
            />
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}

          {lyricsData && <LyricsContent lyricsData={lyricsData} />}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => closeModal("lyrics")}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#121212",
    borderRadius: 16,
    width: "100%",
    height: "75%",
    padding: 20,
    borderWidth: 1,
    borderColor: "#282828",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  songMeta: {
    color: "#b3b3b3",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#282828",
    marginVertical: 12,
  },
  lyricsContainer: {
    flex: 1,
    marginBottom: 15,
  },
  scrollContent: {
    paddingVertical: 180,
  },
  syncType: {
    color: "#1DB954",
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    textTransform: "uppercase",
  },
  lyricLine: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 19,
    fontWeight: "600",
    marginVertical: 8,
    textAlign: "center",
  },
  activeLyricLine: {
    color: "#1DB954",
    fontSize: 22,
    fontWeight: "bold",
  },
  errorText: {
    color: "#ff5b5b",
    textAlign: "center",
    marginVertical: 20,
  },
  closeButton: {
    backgroundColor: "#282828",
    padding: 14,
    borderRadius: 25,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
