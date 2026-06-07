import React, { useEffect } from "react";
import { LogBox, View, ActivityIndicator, StyleSheet } from "react-native";
import { Stack, useSegments, useRouter } from "expo-router";
import { useAudioPlayer } from "expo-audio";
import { AuthProvider, useAuth } from "@/Context/AuthContext";
import { ToastProvider } from "@/Context/ToastContext";
import { useAudioStore } from "@/Stores/useAudioStore";
import GlobalMiniPlayer from "@/Components/GlobalMiniPlayer";
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
  const { navidromeCreds, isLoading } = useAuth();

  const nativePlayerInstance = useAudioPlayer();

  const initializePlayer = useAudioStore((s) => s.initializePlayer);
  const setCachedCreds = useAudioStore((s) => s.setCachedCreds);
  const logoutCleanUp = useAudioStore((s) => s.logoutCleanUp);

  const isLoginScreen = segments[0] === "login";

  useEffect(() => {
    setCachedCreds(navidromeCreds);
  }, [navidromeCreds, setCachedCreds]);

  useEffect(() => {
    if (!nativePlayerInstance) return;
    const teardownNativeControls = initializePlayer(nativePlayerInstance);
    return () => {
      teardownNativeControls();
    };
  }, [nativePlayerInstance, initializePlayer]);

  useEffect(() => {
    if (isLoading) return;

    const isLoggedIn = !!navidromeCreds?.username;

    if (!isLoggedIn && !isLoginScreen) {
      router.replace("/login");
    } else if (isLoggedIn && isLoginScreen) {
      router.replace("/(tabs)");
    }
  }, [segments, isLoginScreen, router, navidromeCreds, isLoading]);

  // Completely teardown player context and OS controls when on the login screen
  useEffect(() => {
    if (isLoginScreen) {
      logoutCleanUp();
    }
  }, [isLoginScreen, logoutCleanUp]);

  if (isLoading) {
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

export function RecommendationsOrchestrator() {
  const triggerLookAhead = useAudioStore((s) => s.triggerLookAhead);
  const queueLength = useAudioStore((s) => s.queue.length);
  const playingSongQueueIndex = useAudioStore((s) => s.playingSongQueueIndex);
  const lookAheadError = useAudioStore((s) => s.lookAheadError);

  useEffect(() => {
    if (playingSongQueueIndex === -1 || queueLength === 0) return;
    triggerLookAhead();
  }, [playingSongQueueIndex, queueLength, lookAheadError, triggerLookAhead]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ToastProvider>
          <RecommendationsOrchestrator />
          <InnerRootLayout />
        </ToastProvider>
      </AuthProvider>
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
