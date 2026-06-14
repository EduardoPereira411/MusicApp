import { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
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
import { useAuth } from "@/Context/AuthContext";
import { buildSubsonicAuthParams } from "@/Services/navidromeService";
import { useTextInputStore } from "@/Stores/useTextInputStore";
import IndependentUpdateTextInput from "@/Components/TextInputs/IndependentUpdateTextInput";

export default function LoginScreen() {
  const router = useRouter();
  const { navidromeCreds, downloadCreds, setNavidromeAuth, setDownloadAuth } =
    useAuth();

  const setStoreField = useTextInputStore((state) => state.setTexts);

  const [showDownloadConfig, setShowDownloadConfig] = useState(false);
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

  useEffect(() => {
    if (navidromeCreds?.serverUrl)
      setStoreField("serverUrl", navidromeCreds.serverUrl);
    if (navidromeCreds?.username)
      setStoreField("username", navidromeCreds.username);
    if (navidromeCreds?.password)
      setStoreField("password", navidromeCreds.password);

    if (downloadCreds?.serverUrl) {
      setStoreField("dlBaseUrl", downloadCreds.serverUrl);
      setStoreField("dlUsername", downloadCreds.username || "");
      setStoreField("dlPassword", downloadCreds.password || "");
      setShowDownloadConfig(true);
    }
  }, [navidromeCreds, downloadCreds]);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleLogin = async () => {
    const storeState = useTextInputStore.getState().texts;
    const serverUrl = storeState["serverUrl"] || "";
    const username = storeState["username"] || "";
    const password = storeState["password"] || "";
    const dlBaseUrl = storeState["dlBaseUrl"] || "";
    const dlUsername = storeState["dlUsername"] || "";
    const dlPassword = storeState["dlPassword"] || "";

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
      const authQueryString = buildSubsonicAuthParams(username, password);
      const cleanServerUrl = serverUrl.replace(/\/$/, "");
      const testUrl = `${cleanServerUrl}/rest/ping.view?${authQueryString}`;

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
        await setNavidromeAuth({
          serverUrl: cleanServerUrl,
          username,
          password,
        });

        if (showDownloadConfig && dlBaseUrl) {
          await setDownloadAuth({
            serverUrl: dlBaseUrl,
            username: dlUsername || undefined,
            password: dlPassword || undefined,
          });
        } else {
          await setDownloadAuth(null);
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

      await setNavidromeAuth(null);
      await setDownloadAuth(null);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 20 : 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Navidrome Subsonic Client</Text>

        <Text style={styles.sectionHeader}>Navidrome Settings</Text>
        <IndependentUpdateTextInput
          textId="serverUrl"
          placeholder="Server URL (e.g., https://music.myhost.com)"
          placeholderTextColor="#888"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          editable={!loading}
        />
        <IndependentUpdateTextInput
          textId="username"
          placeholder="Username"
          placeholderTextColor="#888"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />
        <IndependentUpdateTextInput
          textId="password"
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
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
            <IndependentUpdateTextInput
              textId="dlBaseUrl"
              placeholder="Proxy Base URL (https://proxy-domain.com)"
              placeholderTextColor="#888"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!loading}
            />
            <IndependentUpdateTextInput
              textId="dlUsername"
              placeholder="Proxy Username (Optional)"
              placeholderTextColor="#888"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            <IndependentUpdateTextInput
              textId="dlPassword"
              placeholder="Proxy Password (Optional)"
              placeholderTextColor="#888"
              secureTextEntry
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
