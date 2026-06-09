import {
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Text,
} from "react-native";
import { useSearchStore } from "@/Stores/useSearchStore";

interface SearchBarProps {
  placeholder?: string;
  containerStyle?: ViewStyle;
}

export function SearchBar({
  placeholder = "Search...",
  containerStyle,
}: SearchBarProps) {
  const query = useSearchStore((state) => state.query);
  const setQuery = useSearchStore((state) => state.setQuery);

  return (
    <View style={[styles.searchBarContainer, containerStyle]}>
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor="#888"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
      />

      {query.length > 0 && (
        <TouchableOpacity
          onPress={() => setQuery("")}
          style={styles.clearButton}
        >
          <Text style={styles.clearButtonText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingRight: 8,
  },
  clearButton: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  clearButtonText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "bold",
  },
});
