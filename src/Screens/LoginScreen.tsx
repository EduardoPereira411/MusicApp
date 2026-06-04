import { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  authStorage,
  getSubsonicAuthParams,
} from "@/Services/navidromeService";
import { downloadAuthStorage } from "@/Services/downloadService";

export default function LoginScreen() {
  const router = useRouter();

  // Navidrome settings
  const [serverUrl, setServerUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Download API settings
  const [showDownloadConfig, setShowDownloadConfig] = useState(false);
  const [dlBaseUrl, setDlBaseUrl] = useState("");
  const [dlUsername, setDlUsername] = useState("");
  const [dlPassword, setDlPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setKeyboardHeight(e.endCoordinates.height),
    );
    const keyboardHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardHeight(0),
    );

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleLogin = async () => {
    if (!serverUrl || !username || !password) {
      Alert.alert("Error", "Please fill in all core Navidrome fields.");
      return;
    }

    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 7000);

    try {
      await authStorage.saveCredentials({ serverUrl, username, password });

      const authQueryString = await getSubsonicAuthParams();
      const testUrl = `${serverUrl.replace(/\/$/, "")}/rest/ping.view?${authQueryString}`;

      const response = await fetch(testUrl, { signal: controller.signal });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Connection rejected with status: ${response.status}`);
      }

      const responseText = await response.text();

      if (responseText.trim().startsWith("<")) {
        throw new Error(
          "The server responded with an HTML page instead of API data. Verify your URL.",
        );
      }

      const data = JSON.parse(responseText);
      const subsonicResponse = data["subsonic-response"];

      if (subsonicResponse && subsonicResponse.status === "ok") {
        if (showDownloadConfig && dlBaseUrl) {
          await downloadAuthStorage.saveCredentials({
            baseUrl: dlBaseUrl,
            user: dlUsername,
            pass: dlPassword,
          });
        } else if (!showDownloadConfig) {
          await downloadAuthStorage.clearCredentials();
        }

        Alert.alert("Success", "Configuration applied successfully!");
        router.replace("/(tabs)");
      } else {
        throw new Error(
          subsonicResponse?.error?.message || "Authentication failed.",
        );
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      await authStorage.clearCredentials();

      if (error.name === "AbortError") {
        Alert.alert(
          "Request Stopped",
          "The connection timed out or was cancelled.",
        );
      } else {
        Alert.alert("Connection Failed", error.message || "Could not connect.");
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    async function loadSavedServer() {
      try {
        const navidromeCreds = await authStorage.getCredentials();
        const downloadServerCreds = await downloadAuthStorage.getCredentials();
        if (navidromeCreds?.serverUrl) {
          setServerUrl(navidromeCreds.serverUrl);
        }
        if (downloadServerCreds?.baseUrl) {
          setDlBaseUrl(downloadServerCreds.baseUrl);
          setShowDownloadConfig(true);
        }
      } catch (error) {
        console.error("Failed to load saved server URL:", error);
      }
    }
    loadSavedServer();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 20 : 20 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Navidrome Subsonic Client</Text>

        <Text style={styles.sectionHeader}>Navidrome Settings</Text>
        <TextInput
          style={styles.input}
          placeholder="Server URL (e.g., https://music.myhost.com)"
          placeholderTextColor="#888"
          value={serverUrl}
          onChangeText={setServerUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => setShowDownloadConfig(!showDownloadConfig)}
        >
          <Text style={styles.toggleText}>
            {showDownloadConfig
              ? "▼ Hide Download Proxy API (Optional)"
              : "▶ Configure Download Proxy API (Optional)"}
          </Text>
        </TouchableOpacity>

        {showDownloadConfig && (
          <View style={styles.optionalContainer}>
            <TextInput
              style={styles.input}
              placeholder="Proxy Base URL (https://proxy-domain.com)"
              placeholderTextColor="#888"
              value={dlBaseUrl}
              onChangeText={setDlBaseUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Proxy Username (Optional)"
              placeholderTextColor="#888"
              value={dlUsername}
              onChangeText={setDlUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Proxy Password (Optional)"
              placeholderTextColor="#888"
              secureTextEntry
              value={dlPassword}
              onChangeText={setDlPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>
        )}

        {!loading ? (
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Connect</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="small"
              color="#fff"
              style={{ marginBottom: 12 }}
            />
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel Connection</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#121212",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 25,
    textAlign: "center",
  },
  sectionHeader: {
    color: "#e91e63",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 1,
  },
  toggleRow: {
    paddingVertical: 15,
    marginTop: 10,
  },
  toggleText: {
    color: "#bbb",
    fontSize: 14,
    fontWeight: "600",
  },
  optionalContainer: {
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#1e1e1e",
    color: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#e91e63",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  loadingContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: "#333",
    borderWidth: 1,
    borderColor: "#555",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#ff4a4a",
    fontSize: 15,
    fontWeight: "600",
  },
});
