import { useEffect } from "react";
import { LogBox, View, ActivityIndicator, StyleSheet } from "react-native";
import { Stack, useSegments, useRouter } from "expo-router";
import { AuthProvider, useAuth } from "@/Context/AuthContext"; // Import Auth Context hooks
import { AudioProvider, useAudio } from "@/Context/AudioContext";
import { ToastProvider } from "@/Context/ToastContext";
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
  const { logoutCleanUp } = useAudio();

  const { navidromeCreds, isLoading } = useAuth();

  const isLoginScreen = segments[0] === "login";

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

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ToastProvider>
          <AudioProvider>
            <InnerRootLayout />
          </AudioProvider>
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
