import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useAuth } from "@/Context/AuthContext";
import { useTextInputStore } from "@/Stores/useTextInputStore";
import IndependentUpdateTextInput from "@/Components/TextInputs/IndependentUpdateTextInput";

export const DownloadConfigSection = React.memo(() => {
  const { setDownloadAuth } = useAuth();
  const setStoreText = useTextInputStore((state) => state.setTexts);

  const [showDlConfig, setShowDlConfig] = useState<boolean>(false);
  const [isSavingDl, setIsSavingDl] = useState<boolean>(false);

  const handleSaveDownloadConfig = useCallback(async () => {
    const currentTexts = useTextInputStore.getState().texts;
    const url = currentTexts["dlBaseUrl"] || "";
    const user = currentTexts["dlUsername"] || "";
    const pass = currentTexts["dlPassword"] || "";

    if (!url) {
      Alert.alert("Error", "Proxy Base URL is required.");
      return;
    }

    setIsSavingDl(true);
    try {
      await setDownloadAuth({
        serverUrl: url,
        username: user || undefined,
        password: pass || undefined,
      });
      Alert.alert("Success", "Download API settings updated successfully!");
      setShowDlConfig(false);
    } catch (error) {
      Alert.alert("Error", "Could not save settings securely.");
    } finally {
      setIsSavingDl(false);
    }
  }, [setDownloadAuth]);

  const handleClearDownloadConfig = useCallback(async () => {
    Alert.alert(
      "Remove Configuration",
      "Are you sure you want to delete your Download API setup?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await setDownloadAuth(null);
            setStoreText("dlBaseUrl", "");
            setStoreText("dlUsername", "");
            setStoreText("dlPassword", "");
            setShowDlConfig(false);
            Alert.alert("Cleared", "Proxy configuration has been removed.");
          },
        },
      ],
    );
  }, [setDownloadAuth, setStoreText]);

  return (
    <>
      <TouchableOpacity
        style={styles.toggleRow}
        onPress={() => setShowDlConfig((prev) => !prev)}
      >
        <Text style={styles.toggleText}>
          {showDlConfig
            ? "▼ Hide Download Proxy Setup"
            : "▶ Manage Download Proxy API"}
        </Text>
      </TouchableOpacity>

      {showDlConfig && (
        <View style={styles.configContainer}>
          <Text style={styles.configLabel}>Base URL</Text>
          <IndependentUpdateTextInput
            textId="dlBaseUrl"
            placeholder="https://your-proxy-domain.com"
            autoCapitalize="none"
            containerStyle={styles.input}
            keyboardType="url"
          />

          <Text style={styles.configLabel}>Username (Basic Auth)</Text>
          <IndependentUpdateTextInput
            textId="dlUsername"
            placeholder="Optional proxy access list user"
            autoCapitalize="none"
            containerStyle={styles.input}
          />

          <Text style={styles.configLabel}>Password (Basic Auth)</Text>
          <IndependentUpdateTextInput
            textId="dlPassword"
            placeholder="Optional proxy access list password"
            secureTextEntry
            autoCapitalize="none"
            containerStyle={styles.input}
          />

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSaveDownloadConfig}
              disabled={isSavingDl}
            >
              {isSavingDl ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>Save Proxy</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.clearButton]}
              onPress={handleClearDownloadConfig}
            >
              <Text style={styles.clearButtonText}>Clear Proxy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
});

const styles = StyleSheet.create({
  toggleRow: { paddingVertical: 12 },
  toggleText: { color: "#1DB954", fontSize: 15, fontWeight: "600" },
  configContainer: {
    backgroundColor: "#1e1e1e",
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  configLabel: {
    color: "#b3b3b3",
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#363636",
    color: "#fff",
    borderRadius: 6,
    fontSize: 15,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  actionButton: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    backgroundColor: "#1DB954",
  },
  clearButton: {
    backgroundColor: "#282828",
    borderWidth: 1,
    borderColor: "#444",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  clearButtonText: {
    color: "#ff4d4d",
    fontWeight: "bold",
    fontSize: 14,
  },
});
