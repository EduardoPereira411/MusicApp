import React, { createContext, useContext, useState, useEffect } from "react";
import { authStorage } from "@/Services/navidromeService";
import { downloadAuthStorage } from "@/Services/downloadService";
import { NavidromeCredentials, DownloadAPICredentials } from "@/Models/Models";

interface AuthContextType {
  navidromeCreds: NavidromeCredentials | null;
  downloadCreds: DownloadAPICredentials | null;
  isLoading: boolean;
  setNavidromeAuth: (creds: NavidromeCredentials | null) => Promise<void>;
  setDownloadAuth: (creds: DownloadAPICredentials | null) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [navidromeCreds, setNavidromeCreds] =
    useState<NavidromeCredentials | null>(null);
  const [downloadCreds, setDownloadCreds] =
    useState<DownloadAPICredentials | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function bootstrapStorage() {
      try {
        const [navidrome, download] = await Promise.all([
          authStorage.getCredentials(),
          downloadAuthStorage.getCredentials(),
        ]);

        if (navidrome) setNavidromeCreds(navidrome);
        if (download) setDownloadCreds(download);
      } catch (error) {
        console.error(
          "[AuthContext] Failed to bootstrap application keys safely:",
          error,
        );
      } finally {
        setIsLoading(false);
      }
    }

    bootstrapStorage();
  }, []);

  const setNavidromeAuth = async (creds: NavidromeCredentials | null) => {
    if (creds === null) {
      await authStorage.clearCredentials();
    } else {
      await authStorage.saveCredentials(creds);
    }
    setNavidromeCreds(creds);
  };

  const setDownloadAuth = async (creds: DownloadAPICredentials | null) => {
    if (creds === null) {
      await downloadAuthStorage.clearCredentials();
    } else {
      await downloadAuthStorage.saveCredentials(creds);
    }
    setDownloadCreds(creds);
  };

  const logout = async () => {
    await Promise.all([
      authStorage.clearCredentials(),
      downloadAuthStorage.clearCredentials(),
    ]);
    setNavidromeCreds(null);
    setDownloadCreds(null);
  };

  return (
    <AuthContext.Provider
      value={{
        navidromeCreds,
        downloadCreds,
        isLoading,
        setNavidromeAuth,
        setDownloadAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
