import { memo, useEffect, useState } from "react";
import {
  TextInput,
  TextInputProps,
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Text,
} from "react-native";
import { useTextInputStore } from "@/Stores/useTextInputStore";

interface IndependentUpdateTextInputProps extends TextInputProps {
  textId: string;
  debounceDelay?: number;
  containerStyle?: ViewStyle;
}

const IndependentUpdateTextInput = memo(
  ({
    textId,
    debounceDelay = 0,
    onChangeText,
    containerStyle,
    style,
    placeholder = "Search...",
    ...props
  }: IndependentUpdateTextInputProps) => {
    const [userInput, setUserInput] = useState(
      () => useTextInputStore.getState().texts[textId] || "",
    );
    const setField = useTextInputStore((state) => state.setTexts);

    useEffect(() => {
      if (debounceDelay === 0) {
        setField(textId, userInput);
        return;
      }

      const handler = setTimeout(() => {
        setField(textId, userInput);
      }, debounceDelay);

      return () => clearTimeout(handler);
    }, [userInput, textId, setField, debounceDelay]);

    const globalValue = useTextInputStore((state) => state.texts[textId] || "");
    useEffect(() => {
      setUserInput(globalValue);
    }, [globalValue]);

    const handleClear = () => {
      setUserInput("");
      setField(textId, "");
    };

    return (
      <View style={[styles.componentContainer, containerStyle]}>
        <TextInput
          {...props}
          value={userInput}
          placeholder={placeholder}
          placeholderTextColor="#888"
          autoCorrect={false}
          style={[styles.input, style]}
          onChangeText={(text) => {
            setUserInput(text);
            if (onChangeText) onChangeText(text);
          }}
        />

        {userInput.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  componentContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  input: {
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

export default IndependentUpdateTextInput;
