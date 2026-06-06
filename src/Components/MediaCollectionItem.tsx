import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SharedCollectionData } from "@/Models/Models";
import { useAuth } from "@/Context/AuthContext";
import { getArtworkUrl } from "@/Services/navidromeService";

interface MediaCollectionItemProps {
  item: SharedCollectionData;
}

export const MediaCollectionItem = React.memo(
  ({ item }: MediaCollectionItemProps) => {
    const { navidromeCreds } = useAuth();
    const router = useRouter();
    const isArtist = item.type === "artist";

    const artworkUrl =
      navidromeCreds && item?.coverArt
        ? getArtworkUrl(navidromeCreds, item.coverArt, 150)
        : null;

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

    return (
      <TouchableOpacity style={styles.itemCard} onPress={handlePress}>
        {artworkUrl ? (
          <Image
            source={{ uri: artworkUrl }}
            style={[styles.cardArt, isArtist && styles.artistAvatar]}
            contentFit="cover"
            transition={200}
          />
        ) : isArtist ? (
          <View
            style={[
              styles.cardArt,
              styles.artistAvatar,
              styles.avatarPlaceholder,
            ]}
          >
            <Text style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
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
            {!!item.subtitle && !isArtist && (
              <Text style={styles.subText} numberOfLines={1}>
                {item.subtitle}
              </Text>
            )}

            {!!item.subtitle &&
              !isArtist &&
              item.subItemCount !== undefined && (
                <Text style={styles.bulletDivider}>•</Text>
              )}

            {item.subItemCount !== undefined ? (
              <Text style={styles.subText}>
                {item.subItemCount}{" "}
                {isArtist
                  ? item.subItemCount === 1
                    ? "album"
                    : "albums"
                  : item.subItemCount === 1
                    ? "track"
                    : "tracks"}
              </Text>
            ) : (
              isArtist && <Text style={styles.subText}>Artist</Text>
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
  artistAvatar: {
    borderRadius: 27.5,
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#444",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
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
