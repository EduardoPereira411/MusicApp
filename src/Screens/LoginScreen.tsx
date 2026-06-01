import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();

  const handleLogin = () => {
    router.replace("/(tabs)"); //Remove back option so you can't back to login screen
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🎵 MusicApp</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: { fontSize: 32, fontWeight: "bold", color: "#fff", marginBottom: 40 },
  button: {
    backgroundColor: "#1DB954",
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 25,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
