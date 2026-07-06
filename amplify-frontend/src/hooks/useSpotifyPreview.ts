import { useState, useCallback } from 'react';

const CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || '';
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  if (!CLIENT_ID || !CLIENT_SECRET) return null;

  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
      },
      body: 'grant_type=client_credentials',
    });
    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return cachedToken;
  } catch {
    return null;
  }
}

export function useSpotifyPreview() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getPreviewUrl = useCallback(async (trackId: string) => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (token) {
        const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const track = await res.json();
        const url = track.preview_url ?? `https://cdn.doorbeen.io/previews/${trackId}.mp3`;
        setPreviewUrl(url);
        return url;
      }
      const fallback = `https://cdn.doorbeen.io/previews/${trackId}.mp3`;
      setPreviewUrl(fallback);
      return fallback;
    } catch {
      const fallback = `https://cdn.doorbeen.io/previews/${trackId}.mp3`;
      setPreviewUrl(fallback);
      return fallback;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openInSpotify = useCallback((trackId: string) => {
    window.open(`https://open.spotify.com/track/${trackId}`, '_blank');
  }, []);

  return { previewUrl, isLoading, getPreviewUrl, openInSpotify };
}
