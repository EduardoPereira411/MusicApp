import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Album } from "@/Models/Models";

interface AlbumItemProps {
  item: Album;
}

export const AlbumItem = React.memo(({ item }: AlbumItemProps) => {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: "/(tabs)/playlist",
      params: {
        id: item.id,
        type: "album",
        name: item.name,
      },
    });
  };

  return (
    <TouchableOpacity style={styles.itemCard} onPress={handlePress}>
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
  );
});

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
