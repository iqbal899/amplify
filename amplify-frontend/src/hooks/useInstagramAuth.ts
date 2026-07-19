import { useState, useEffect, useCallback } from 'react';
import { useAuthRequest, makeRedirectUri, ResponseType } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '@/store/authStore';
import {
  connectInstagram as connectInstagramRequest,
  getInstagramStatus,
  disconnectInstagram as disconnectInstagramRequest,
  type InstagramConnection,
} from '@/services/instagram';

WebBrowser.maybeCompleteAuthSession();

// Instagram API with Instagram Login (not the retired Basic Display API).
const discovery = {
  authorizationEndpoint: 'https://www.instagram.com/oauth/authorize',
};

// instagram_business_basic identifies the account; manage_insights is what
// actually lets us read view counts on their reels.
const SCOPES = ['instagram_business_basic', 'instagram_business_manage_insights'];

export function useInstagramAuth() {
  const updateCreator = useAuthStore((state) => state.updateCreator);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<InstagramConnection | null>(null);

  // Must match app.json's `scheme` exactly, and must be registered as a valid
  // OAuth redirect URI in the Meta app dashboard.
  const redirectUri = makeRedirectUri({
    scheme: 'amplify',
    path: 'oauth/callback',
  });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_INSTAGRAM_CLIENT_ID ?? '',
      scopes: SCOPES,
      redirectUri,
      responseType: ResponseType.Code,
    },
    discovery
  );

  const refreshStatus = useCallback(async () => {
    try {
      const data = await getInstagramStatus();
      setConnection(data.instagram);
      return data.instagram;
    } catch {
      // Non-fatal: the screen just shows the disconnected state.
      return null;
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // The exchange happens on our backend — the client secret must never be
  // bundled into the app, and the access token should never reach the device.
  useEffect(() => {
    if (response?.type === 'error') {
      setError(response.params?.error_description ?? 'Instagram authorization failed');
      setIsLoading(false);
      return;
    }

    if (response?.type !== 'success' || !response.params?.code) {
      return;
    }

    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await connectInstagramRequest({
          code: response.params.code,
          redirectUri,
        });

        if (cancelled) return;

        await refreshStatus();

        updateCreator({
          instagramUsername: data?.instagram?.instagramUsername ?? null,
        });
      } catch (err: any) {
        if (cancelled) return;

        console.error('[instagram] connect failed', {
          status: err?.response?.status,
          data: err?.response?.data,
          message: err?.message,
        });

        setError(
          err?.response?.data?.message ??
            (err?.response
              ? 'Could not connect Instagram. Please try again.'
              : "Can't reach the server. Check your connection and try again.")
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [response, redirectUri, updateCreator, refreshStatus]);

  const connect = async () => {
    if (!process.env.EXPO_PUBLIC_INSTAGRAM_CLIENT_ID) {
      setError('Instagram is not configured. Set EXPO_PUBLIC_INSTAGRAM_CLIENT_ID.');
      return;
    }

    try {
      setError(null);
      await promptAsync();
    } catch {
      setError('Could not open Instagram login.');
    }
  };

  const disconnect = async () => {
    try {
      setIsLoading(true);
      await disconnectInstagramRequest();
      setConnection(null);
      updateCreator({ instagramUsername: null });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not disconnect Instagram.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    connect,
    disconnect,
    refreshStatus,
    connection,
    isLoading,
    error,
    isReady: Boolean(request),
    redirectUri,
  };
}
