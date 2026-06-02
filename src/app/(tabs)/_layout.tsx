import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { AudioProvider } from "../../Context/AudioContext";
import GlobalMiniPlayer from "../../Components/GlobalMiniPlayer"; // Import your new component here!

export default function TabLayout() {
  return (
    <AudioProvider>
      <View style={{ flex: 1, backgroundColor: "#121212" }}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: "#1DB954",
            tabBarInactiveTintColor: "#888888",
            tabBarStyle: {
              backgroundColor: "#121212",
              borderTopWidth: 0,
              elevation: 0,
            },
            headerShown: false,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="search"
            options={{
              title: "Search",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="search" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: "Profile",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="person" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="playlist"
            options={{
              href: null,
            }}
          />
        </Tabs>

        <GlobalMiniPlayer />
      </View>
    </AudioProvider>
  );
}
