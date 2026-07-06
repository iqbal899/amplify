import { useState, useEffect } from 'react';
import { useAuthRequest } from 'expo-auth-session';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '@/store/authStore';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://api.instagram.com/oauth/authorize',
};

export function useInstagramAuth() {
  const { setInstagram } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const redirectUri = makeRedirectUri({
    scheme: 'doorbeenamplify',
    path: 'oauth/callback',
  });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_INSTAGRAM_CLIENT_ID || 'mock_client_id',
      scopes: ['user_profile', 'user_media'],
      redirectUri,
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success' && response.params?.code) {
      setIsLoading(true);
      setTimeout(() => {
        setInstagram(
          'mock_token_' + response.params.code,
          'creator_' + Math.floor(Math.random() * 9999),
          'ig_user_' + Math.floor(Math.random() * 99999)
        );
        setIsLoading(false);
      }, 1000);
    }
  }, [response]);

  const connectInstagram = async () => {
    try {
      setIsLoading(true);
      await promptAsync();
    } catch {
      setIsLoading(false);
    }
  };

  const skipInstagram = () => {
  };

  return { connectInstagram, skipInstagram, isLoading, response };
}
