import { Stack } from "expo-router";
import { LogBox } from "react-native";
// Ignore Media COntrol Logs
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

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
