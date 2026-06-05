import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";

interface ErrorDisplayProps {
  title?: string;
  message: string | null;
  onRetry?: () => void;
  retryButtonTitle?: string;
}

export function ErrorDisplay({
  title = "Pipeline Error Encountered",
  message,
  onRetry,
  retryButtonTitle = "Retry Operation",
}: ErrorDisplayProps) {
  // Gracefully return nothing if there's no error message present
  if (!message) return null;

  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorBoxTitle}>{title}</Text>
      <Text style={styles.errorBoxMessage}>{message}</Text>
      {onRetry && (
        <View style={styles.retryWrapper}>
          <Button title={retryButtonTitle} color="#1DB954" onPress={onRetry} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    backgroundColor: "#2c1518",
    borderColor: "#e91e63",
    borderWidth: 1,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    marginTop: 8,
  },
  errorBoxTitle: {
    color: "#e91e63",
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
  },
  errorBoxMessage: {
    color: "#ffb4c4",
    fontSize: 13,
    lineHeight: 18,
  },
  retryWrapper: {
    marginTop: 12,
    alignSelf: "flex-start",
  },
});
