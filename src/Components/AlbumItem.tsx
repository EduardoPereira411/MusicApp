import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";

export interface Album {
  id: string;
  name: string;
  artist: string;
  artworkUrl?: string;
}

interface AlbumItemProps {
  item: Album;
  onPress: (id: string) => void;
}

export const AlbumItem = React.memo(({ item, onPress }: AlbumItemProps) => (
  <TouchableOpacity style={styles.itemCard} onPress={() => onPress(item.id)}>
    <Image
      source={{ uri: item.artworkUrl }}
      style={styles.cardArt}
      contentFit="cover"
      transition={200}
    />
    <View style={styles.infoContainer}>
      <Text style={styles.mainText} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.subText} numberOfLines={1}>
        {item.artist}
      </Text>
    </View>
  </TouchableOpacity>
));

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
    backgroundColor: "#333",
    marginRight: 14,
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
  subText: {
    color: "#b3b3b3",
    fontSize: 13,
  },
});
