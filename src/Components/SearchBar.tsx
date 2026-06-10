import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Text,
} from "react-native";
import { useTextInputStore } from "@/Stores/useTextInputStore";
import IndependentUpdateTextInput from "@/Components/TextInputs/IndependentUpdateTextInput";

interface SearchBarProps {
  searchBarID: string;
  placeholder?: string;
  containerStyle?: ViewStyle;
  onChangeDelay?: number;
}

export function SearchBar({
  searchBarID,
  placeholder = "Search...",
  containerStyle,
  onChangeDelay = 600,
}: SearchBarProps) {
  const currentSearchValue = useTextInputStore(
    (state) => state.texts[searchBarID] || "",
  );
  const setQuery = useTextInputStore((state) => state.setTexts);

  const handleClear = () => {
    setQuery(searchBarID, "");
  };

  return (
    <View style={[styles.searchBarContainer, containerStyle]}>
      <IndependentUpdateTextInput
        textId={searchBarID}
        debounceDelay={onChangeDelay}
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor="#888"
        autoCorrect={false}
      />

      {currentSearchValue.length > 0 && (
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
