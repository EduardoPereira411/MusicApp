import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SharedCollectionData } from "@/Models/Models";

interface MediaCollectionItemProps {
  item: SharedCollectionData;
}

export const MediaCollectionItem = React.memo(
  ({ item }: MediaCollectionItemProps) => {
    const router = useRouter();

    const handlePress = () => {
      router.push({
        pathname: "/playlist",
        params: {
          id: item.id,
          type: item.type,
          name: item.name,
        },
      });
    };

    const hasArt = !!item.artworkUrl;

    return (
      <TouchableOpacity style={styles.itemCard} onPress={handlePress}>
        {hasArt ? (
          <Image
            source={{ uri: item.artworkUrl }}
            style={styles.cardArt}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.cardArt, styles.iconPlaceholder]}>
            <Text style={styles.placeholderIcon}>📁</Text>
          </View>
        )}

        <View style={styles.infoContainer}>
          <Text style={styles.mainText} numberOfLines={1}>
            {item.name}
          </Text>

          <View style={styles.subTextRow}>
            {!!item.subtitle && (
              <Text style={styles.subText} numberOfLines={1}>
                {item.subtitle}
              </Text>
            )}
            {item.subtitle && item.songCount !== undefined && (
              <Text style={styles.bulletDivider}>•</Text>
            )}
            {item.songCount !== undefined && (
              <Text style={styles.subText}>
                {item.songCount} {item.songCount === 1 ? "track" : "tracks"}
              </Text>
            )}
          </View>
        </View>

        {item.type === "playlist" && <Text style={styles.arrowIcon}>〉</Text>}
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  itemCard: {
    backgroundColor: "#1e1e1e",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  cardArt: {
    width: 55,
    height: 55,
    borderRadius: 6,
    backgroundColor: "#282828",
    marginRight: 14,
  },
  iconPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderIcon: {
    fontSize: 24,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  mainText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  subTextRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  subText: {
    color: "#b3b3b3",
    fontSize: 13,
  },
  bulletDivider: {
    color: "#666",
    marginHorizontal: 6,
    fontSize: 13,
  },
  arrowIcon: {
    color: "#b3b3b3",
    fontSize: 16,
    paddingHorizontal: 4,
  },
});
