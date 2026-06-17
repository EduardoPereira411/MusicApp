import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { DownloadAPICredentials } from "@/Models/Models";

const DOWNLOAD_KEYS = {
  SERVER_URL: "download_server_url",
  USERNAME: "download_username",
  PASSWORD: "download_password",
};

// Simple decoupled storage service for downloads
export const downloadAuthStorage = {
  async saveCredentials({
    serverUrl,
    username,
    password,
  }: DownloadAPICredentials) {
    const cleanUrl = serverUrl.replace(/\/$/, "");
    await SecureStore.setItemAsync(DOWNLOAD_KEYS.SERVER_URL, cleanUrl);
    if (username)
      await SecureStore.setItemAsync(DOWNLOAD_KEYS.USERNAME, username);
    if (password)
      await SecureStore.setItemAsync(DOWNLOAD_KEYS.PASSWORD, password);
  },
  async getCredentials(): Promise<DownloadAPICredentials | null> {
    const serverUrl = await SecureStore.getItemAsync(DOWNLOAD_KEYS.SERVER_URL);
    const username =
      (await SecureStore.getItemAsync(DOWNLOAD_KEYS.USERNAME)) || undefined;
    const password =
      (await SecureStore.getItemAsync(DOWNLOAD_KEYS.PASSWORD)) || undefined;
    if (!serverUrl) return null;
    return { serverUrl, username, password };
  },
  async clearCredentials() {
    await SecureStore.deleteItemAsync(DOWNLOAD_KEYS.SERVER_URL);
    await SecureStore.deleteItemAsync(DOWNLOAD_KEYS.USERNAME);
    await SecureStore.deleteItemAsync(DOWNLOAD_KEYS.PASSWORD);
  },
};

interface DownloadContextType {
  downloadCreds: DownloadAPICredentials | null;
  isDownloadLoading: boolean;
  setDownloadAuth: (creds: DownloadAPICredentials | null) => Promise<void>;
  clearDownloadAuth: () => Promise<void>;
}

const DownloadContext = createContext<DownloadContextType | undefined>(
  undefined,
);

export function DownloadProvider({ children }: { children: React.ReactNode }) {
  const [downloadCreds, setDownloadCreds] =
    useState<DownloadAPICredentials | null>(null);
  const [isDownloadLoading, setIsDownloadLoading] = useState(true);

  useEffect(() => {
    async function bootstrapDownloadStorage() {
      try {
        const download = await downloadAuthStorage.getCredentials();
        if (download) setDownloadCreds(download);
      } catch (error) {
        console.error(
          "[DownloadContext] Failed to bootstrap download keys:",
          error,
        );
      } finally {
        setIsDownloadLoading(false);
      }
    }
    bootstrapDownloadStorage();
  }, []);

  const setDownloadAuth = async (creds: DownloadAPICredentials | null) => {
    if (creds === null) {
      await downloadAuthStorage.clearCredentials();
    } else {
      await downloadAuthStorage.saveCredentials(creds);
    }
    setDownloadCreds(creds);
  };

  const clearDownloadAuth = async () => {
    await downloadAuthStorage.clearCredentials();
    setDownloadCreds(null);
  };

  return (
    <DownloadContext.Provider
      value={{
        downloadCreds,
        isDownloadLoading,
        setDownloadAuth,
        clearDownloadAuth,
      }}
    >
      {children}
    </DownloadContext.Provider>
  );
}

export function useDownloadAuth() {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error("useDownloadAuth must be used within a DownloadProvider");
  }
  return context;
}
