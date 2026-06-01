import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export interface Artist {
  id: string;
  name: string;
  albumCount?: number;
}

interface ArtistItemProps {
  item: Artist;
  onPress: (id: string) => void;
}

export const ArtistItem = React.memo(({ item, onPress }: ArtistItemProps) => (
  <TouchableOpacity style={styles.itemCard} onPress={() => onPress(item.id)}>
    <View style={styles.artistAvatarPlaceholder}>
      <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
    </View>
    <View style={styles.infoContainer}>
      <Text style={styles.mainText} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.subText}>
        {item.albumCount ? `${item.albumCount} Albums` : "Artist"}
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
  artistAvatarPlaceholder: {
    width: 55,
    height: 55,
    marginRight: 14,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 27.5,
    backgroundColor: "#444",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
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
