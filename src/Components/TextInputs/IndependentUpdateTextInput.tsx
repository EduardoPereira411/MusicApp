import { memo, useEffect, useState } from "react";
import { TextInput, TextInputProps } from "react-native";
import { useTextInputStore } from "@/Stores/useTextInputStore";

interface IndependentUpdateTextInputProps extends TextInputProps {
  textId: string;
  debounceDelay?: number;
}

const IndependentUpdateTextInput = memo(
  ({
    textId,
    debounceDelay = 0,
    onChangeText,
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

    return (
      <TextInput
        {...props}
        value={userInput}
        onChangeText={(text) => {
          setUserInput(text);
          if (onChangeText) onChangeText(text);
        }}
      />
    );
  },
);

export default IndependentUpdateTextInput;
