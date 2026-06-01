import * as SecureStore from "expo-secure-store";
import md5 from "md5";

const KEYS = {
  SERVER_URL: "navidrome_server_url",
  USERNAME: "navidrome_username",
  PASSWORD: "navidrome_password",
};

export interface Credentials {
  serverUrl: string;
  username: string;
  password?: string;
}

export const authStorage = {
  async saveCredentials({ serverUrl, username, password }: Credentials) {
    const cleanUrl = serverUrl.replace(/\/$/, "");
    await SecureStore.setItemAsync(KEYS.SERVER_URL, cleanUrl);
    await SecureStore.setItemAsync(KEYS.USERNAME, username);
    if (password) {
      await SecureStore.setItemAsync(KEYS.PASSWORD, password);
    }
  },

  async getCredentials(): Promise<Credentials | null> {
    const serverUrl = await SecureStore.getItemAsync(KEYS.SERVER_URL);
    const username = await SecureStore.getItemAsync(KEYS.USERNAME);
    const password = await SecureStore.getItemAsync(KEYS.PASSWORD);

    if (!serverUrl || !username || !password) return null;
    return { serverUrl, username, password };
  },

  async clearCredentials() {
    await SecureStore.deleteItemAsync(KEYS.SERVER_URL);
    await SecureStore.deleteItemAsync(KEYS.USERNAME);
    await SecureStore.deleteItemAsync(KEYS.PASSWORD);
  },
};

/**
 * Generates the required Subsonic auth query string parameters (u, t, s, v, c, f)
 * Subsonic token format: md5(password + salt)
 */
export async function getSubsonicAuthParams(): Promise<string | null> {
  const creds = await authStorage.getCredentials();
  if (!creds || !creds.password) return null;

  const salt = Math.random().toString(36).substring(2, 10);
  const token = md5(creds.password + salt);

  const params = new URLSearchParams({
    u: creds.username,
    t: token,
    s: salt,
    v: "1.16.1",
    c: "my-music-app",
    f: "json",
  });

  return params.toString();
}
