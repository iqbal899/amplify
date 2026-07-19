/**
 * AES-256-GCM encryption for Instagram access tokens at rest.
 *
 * Tokens are effectively bearer credentials for a creator's Instagram account,
 * so they must not sit in the database as plaintext. Uses Web Crypto, which is
 * available in the Workers runtime without any polyfill.
 *
 * TOKEN_ENCRYPTION_KEY must be 32 bytes, base64-encoded:
 *   openssl rand -base64 32
 */

const IV_BYTES = 12; // GCM standard

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  // Explicitly ArrayBuffer-backed: Web Crypto's BufferSource rejects the
  // ArrayBufferLike default, which could be a SharedArrayBuffer.
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function importKey(rawKey: string): Promise<CryptoKey> {
  const keyBytes = base64ToBytes(rawKey);

  if (keyBytes.length !== 32) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must be 32 bytes base64-encoded (openssl rand -base64 32)"
    );
  }

  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/** Returns base64(iv || ciphertext). */
export async function encryptToken(
  plaintext: string,
  rawKey: string
): Promise<string> {
  const key = await importKey(rawKey);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return bytesToBase64(combined);
}

export async function decryptToken(
  encrypted: string,
  rawKey: string
): Promise<string> {
  const key = await importKey(rawKey);
  const combined = base64ToBytes(encrypted);

  const iv = combined.slice(0, IV_BYTES);
  const ciphertext = combined.slice(IV_BYTES);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}
