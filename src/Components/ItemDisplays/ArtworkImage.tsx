import React, { useMemo } from "react";
import { StyleSheet, View, Text } from "react-native";
import { Image, ImageProps } from "expo-image";
import { useAuth } from "@/Context/AuthContext";
import { getArtworkUrl } from "@/Services/navidromeService";

interface ArtworkImageProps extends Omit<Partial<ImageProps>, "source"> {
  coverArtId?: string | null;
  size?: number;
  type?: "track" | "album" | "artist" | "playlist";
  fallbackName?: string;
}

export const ArtworkImage = React.memo(
  ({
    coverArtId,
    size = 100,
    type = "track",
    fallbackName,
    style,
    transition = 200,
    cachePolicy = "memory-disk",
    ...restProps
  }: ArtworkImageProps) => {
    const { navidromeCreds } = useAuth();

    const artworkUrl = useMemo(() => {
      if (navidromeCreds && coverArtId) {
        return getArtworkUrl(navidromeCreds, coverArtId, size);
      }
      return null;
    }, [navidromeCreds, coverArtId, size]);

    const isArtist = type === "artist";

    if (artworkUrl) {
      return (
        <Image
          source={{ uri: artworkUrl }}
          style={[styles.baseArt, isArtist && styles.artistAvatar, style]}
          transition={transition}
          cachePolicy={cachePolicy}
          recyclingKey={artworkUrl}
          contentFit="cover"
          {...restProps}
        />
      );
    }

    if (isArtist && fallbackName) {
      return (
        <View
          style={[
            styles.baseArt,
            styles.artistAvatar,
            styles.placeholder,
            style,
          ]}
        >
          <Text style={styles.avatarText}>
            {fallbackName.charAt(0).toUpperCase()}
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.baseArt, styles.placeholder, style]}>
        <Text style={styles.placeholderIcon}>
          {type === "playlist" ? "📁" : "🎵"}
        </Text>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  baseArt: {
    width: 55,
    height: 55,
    borderRadius: 6,
    backgroundColor: "#282828",
  },
  artistAvatar: {
    borderRadius: 999,
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  placeholderIcon: {
    fontSize: 20,
  },
});
