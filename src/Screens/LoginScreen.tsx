import { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  authStorage,
  getSubsonicAuthParams,
} from "@/Services/navidromeService";

export default function LoginScreen() {
  const router = useRouter();
  const [serverUrl, setServerUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleLogin = async () => {
    if (!serverUrl || !username || !password) {
      Alert.alert("Error", "Please fill in all configuration fields.");
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
        if (response.status === 404) {
          throw new Error(
            "Server or Subsonic API endpoint not found (404). Check your URL.",
          );
        }
        if (response.status >= 500) {
          throw new Error(
            `Server error (${response.status}). Try again later.`,
          );
        }
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
        Alert.alert("Success", "Connected to Navidrome server!");
        router.replace("/(tabs)");
      } else if (subsonicResponse && subsonicResponse.error) {
        throw new Error(
          subsonicResponse.error.message || "Authentication failed.",
        );
      } else {
        throw new Error("Invalid endpoint response schema.");
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      await authStorage.clearCredentials();

      if (error.name === "AbortError") {
        Alert.alert(
          "Request Stopped",
          "The connection timed out or was cancelled by the user.",
        );
      } else {
        Alert.alert(
          "Connection Failed",
          error.message ||
            "Could not connect to the server. Check your URL or network connection.",
        );
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Navidrome Subsonic Client</Text>

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
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel Connection</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#121212",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 30,
    textAlign: "center",
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
    marginTop: 10,
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
