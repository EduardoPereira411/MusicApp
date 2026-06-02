import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAudio } from "@/Context/AudioContext";
import { Image } from "expo-image";

interface QueueModalProps {
  visible: boolean;
  onClose: () => void;
}

export function QueueModal({ visible, onClose }: QueueModalProps) {
  const { queue, currentIndex, skipToQueueIndex, removeFromQueue } = useAudio();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <View
        style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="chevron-down" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Play Queue</Text>
          <View style={styles.headerSpacer} />
        </View>

        <FlatList
          data={queue}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Queue is currently empty</Text>
          }
          renderItem={({ item, index }) => {
            const isPlaying = index === currentIndex;
            return (
              <View style={[styles.trackRow, isPlaying && styles.playingRow]}>
                <TouchableOpacity
                  style={styles.trackDetails}
                  onPress={() => {
                    skipToQueueIndex(index);
                  }}
                >
                  {item.artworkUrl ? (
                    <Image
                      source={{ uri: item.artworkUrl }}
                      style={styles.artwork}
                    />
                  ) : (
                    <View style={[styles.artwork, styles.fallbackArtwork]} />
                  )}
                  <View style={styles.textContainer}>
                    <Text
                      style={[styles.title, isPlaying && styles.playingText]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.artist} numberOfLines={1}>
                      {item.artist}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeFromQueue(index)}
                >
                  <Ionicons name="trash-outline" size={20} color="#ff4d4d" />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#282828",
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerSpacer: {
    width: 28,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emptyText: {
    color: "#b3b3b3",
    textAlign: "center",
    marginTop: 40,
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  playingRow: {
    backgroundColor: "#282828",
    borderColor: "#1DB954",
    borderWidth: 1,
  },
  trackDetails: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 4,
  },
  fallbackArtwork: {
    backgroundColor: "#333",
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  playingText: {
    color: "#1DB954",
  },
  artist: {
    color: "#b3b3b3",
    fontSize: 12,
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
});
