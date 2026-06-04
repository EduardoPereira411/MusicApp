import { useEffect, useState } from "react";
import { LogBox, View, ActivityIndicator, StyleSheet } from "react-native";
import { Stack, useSegments, useRouter } from "expo-router";
import { AudioProvider, useAudio } from "@/Context/AudioContext";
import GlobalMiniPlayer from "@/Components/GlobalMiniPlayer";
import { authStorage } from "@/Services/navidromeService";
import { GestureHandlerRootView } from "react-native-gesture-handler";

LogBox.ignoreLogs(["Dispatching media control event"]);
const originalLog = console.log;
console.log = (...args) => {
  try {
    const logString = args
      .map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg) : String(arg),
      )
      .join(" ");

    if (logString.includes("📱 JS")) {
      return;
    }
  } catch (e) {}

  originalLog(...args);
};

function InnerRootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const { logoutCleanUp } = useAudio();
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  const isLoginScreen = segments[0] === "login";

  // Authentication Routing Guard
  useEffect(() => {
    async function checkAuth() {
      try {
        const creds = await authStorage.getCredentials();
        const isLoggedIn = !!creds?.username;

        if (!isLoggedIn && !isLoginScreen) {
          router.replace("/login");
        } else if (isLoggedIn && isLoginScreen) {
          router.replace("/(tabs)");
        }
      } catch (e) {
        console.error("Auth initialization check failed:", e);
      } finally {
        setIsAuthChecked(true);
      }
    }
    checkAuth();
  }, [segments, isLoginScreen, router]);

  // Completely teardown player context and OS controls when on the login screen
  useEffect(() => {
    if (isLoginScreen) {
      logoutCleanUp();
    }
  }, [isLoginScreen, logoutCleanUp]);

  if (!isAuthChecked) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="playlist" />
      </Stack>

      {!isLoginScreen && <GlobalMiniPlayer />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AudioProvider>
        <InnerRootLayout />
      </AudioProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },
});
