import React, { createContext, useContext, useState, useEffect } from "react";
import { authStorage } from "@/Services/navidromeService";
import { NavidromeCredentials } from "@/Models/Models";

interface AuthContextType {
  navidromeCreds: NavidromeCredentials | null;
  isLoading: boolean;
  setNavidromeAuth: (creds: NavidromeCredentials | null) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [navidromeCreds, setNavidromeCreds] =
    useState<NavidromeCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function bootstrapStorage() {
      try {
        const navidrome = await authStorage.getCredentials();
        if (navidrome) setNavidromeCreds(navidrome);
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

  const logout = async () => {
    await authStorage.clearCredentials();
    const savedNavidromeCreds = await authStorage.getCredentials();

    setNavidromeCreds(
      savedNavidromeCreds
        ? {
            serverUrl: savedNavidromeCreds.serverUrl,
            username: "",
            password: "",
          }
        : null,
    );
  };

  return (
    <AuthContext.Provider
      value={{ navidromeCreds, isLoading, setNavidromeAuth, logout }}
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
