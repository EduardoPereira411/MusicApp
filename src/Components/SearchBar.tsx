import {
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Text,
} from "react-native";
import { useSearchStore } from "@/Stores/useSearchStore";
import { useEffect, useState } from "react";
import { SearchContextID } from "@/Models/Models";

interface SearchBarProps {
  searchBarID: SearchContextID;
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
  const [userInput, setUserInput] = useState(
    useSearchStore.getState().queries[searchBarID] || "",
  );
  const setQuery = useSearchStore((state) => state.setQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      setQuery(searchBarID, userInput);
    }, onChangeDelay);
    return () => clearTimeout(handler);
  }, [userInput, setQuery]);

  return (
    <View style={[styles.searchBarContainer, containerStyle]}>
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor="#888"
        value={userInput}
        onChangeText={(val) => setUserInput(val)}
        autoCorrect={false}
      />

      {userInput.length > 0 && (
        <TouchableOpacity
          onPress={() => setQuery(searchBarID, userInput)}
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
