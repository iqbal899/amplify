import Constants from "expo-constants";

const API_PORT = 8787;

/**
 * Resolves the backend URL for the current environment.
 *
 * In dev we derive the host from the Metro packager URI, so the app follows the
 * dev machine onto whatever network it lands on. A hardcoded LAN IP goes stale
 * the moment the DHCP lease changes, which surfaces as an opaque "Network Error".
 *
 * Set EXPO_PUBLIC_API_URL to override (tunnels, staging, production).
 */
function resolveApiBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  // e.g. "10.84.189.181:8081" in Expo Go, "localhost:8081" in a simulator
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | undefined)
      ?.debuggerHost;

  const host = hostUri?.split(":")[0];
  if (host) {
    return `http://${host}:${API_PORT}`;
  }

  return `http://localhost:${API_PORT}`;
}

export const API_BASE_URL = resolveApiBaseUrl();
