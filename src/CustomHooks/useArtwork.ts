import { useMemo } from "react";
import { useAuth } from "@/Context/AuthContext";
import { getArtworkUrl } from "@/Services/navidromeService";

/**
 * Custom hook to synchronously generate an authenticated Subsonic artwork URL.
 * Bypasses async state lifecycles for maximum list rendering performance.
 */
export function useArtwork(coverArtId: string | undefined, size: number = 300) {
  const { navidromeCreds } = useAuth();

  const url = useMemo(() => {
    if (!navidromeCreds || !coverArtId) return null;

    return getArtworkUrl(navidromeCreds, coverArtId, size);
  }, [navidromeCreds, coverArtId, size]);

  return { url };
}
