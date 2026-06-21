import { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import IndependentUpdateTextInput from "@/Components/TextInputs/IndependentUpdateTextInput";
import { useDownloadAuth } from "@/Context/DownloadContext";
import { useTextInputStore } from "@/Stores/useTextInputStore";
import { DownloadPageList } from "@/Components/ItemLists/DownloadPageList";
import {
  DownloadSectionHeader,
  DownloadSectionVisibilityContainer,
} from "@/Components/Headers/DownloadSectionSelector";
import { AlbumTracksDownloadModal } from "@/Components/Modals/AlbumTracksDownloadModal";

export default function DownloadSearchScreen() {
  const router = useRouter();
  const { downloadCreds } = useDownloadAuth();
  const { q } = useLocalSearchParams<{ q?: string }>();

  useEffect(() => {
    if (q) {
      useTextInputStore.getState().setTexts("download-search", q);
    }
    return () => {
      useTextInputStore.getState().setTexts("download-search", "");
    };
  }, [q]);

  useEffect(() => {
    if (!downloadCreds) {
      Alert.alert(
        "Setup Required",
        "Please configure your Download API server credentials in the Profile tab first.",
      );
    }
  }, [downloadCreds]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRowContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <View style={styles.titleTextGroup}>
          <Text style={styles.header}>Download Music</Text>
          <Text style={styles.subHeader}>
            Search & import tracks directly into your server
          </Text>
        </View>
      </View>

      <IndependentUpdateTextInput
        textId="download-search"
        debounceDelay={600}
        placeholder="Search YouTube Music..."
      />

      <DownloadSectionHeader />

      <AlbumTracksDownloadModal />

      <View style={styles.screenWrapper}>
        <DownloadSectionVisibilityContainer targetSection="tracks">
          <DownloadPageList
            activeSection="tracks"
            downloadCreds={downloadCreds}
          />
        </DownloadSectionVisibilityContainer>

        <DownloadSectionVisibilityContainer targetSection="albums">
          <DownloadPageList
            activeSection="albums"
            downloadCreds={downloadCreds}
          />
        </DownloadSectionVisibilityContainer>

        <DownloadSectionVisibilityContainer targetSection="artists">
          <View style={styles.notImplementedContainer}>
            <Text style={styles.notImplementedText}>
              Not implemented yet, sowy :(
            </Text>
          </View>
        </DownloadSectionVisibilityContainer>
        <DownloadSectionVisibilityContainer targetSection="videos">
          <View style={styles.notImplementedContainer}>
            <Text style={styles.notImplementedText}>
              Not implemented yet, sowy :(
            </Text>
          </View>
        </DownloadSectionVisibilityContainer>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 16,
  },
  headerRowContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 60,
    marginBottom: 16,
  },
  backButton: {
    paddingRight: 14,
    paddingTop: 2,
  },
  titleTextGroup: {
    flex: 1,
  },
  header: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  subHeader: {
    color: "#666",
    fontSize: 13,
    marginTop: 2,
  },
  screenWrapper: {
    flex: 1,
  },
  notImplementedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notImplementedText: {
    color: "#b3b3b3",
    fontSize: 15,
    fontStyle: "italic",
  },
});
