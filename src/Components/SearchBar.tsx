import {
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Text,
} from "react-native";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  containerStyle?: ViewStyle;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search...",
  containerStyle,
}: SearchBarProps) {
  const handleClear = () => {
    onChangeText("");
  };

  return (
    <View style={[styles.searchBarContainer, containerStyle]}>
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor="#888"
        value={value}
        onChangeText={onChangeText}
        autoCorrect={false}
      />

      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
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
