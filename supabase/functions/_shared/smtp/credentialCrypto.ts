const ALGO = "AES-GCM"

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function getEncryptionKey(): Promise<CryptoKey> {
  const raw = Deno.env.get("SMTP_CREDENTIALS_ENCRYPTION_KEY")?.trim()
  if (!raw) {
    throw new Error("SMTP_CREDENTIALS_ENCRYPTION_KEY ausente no ambiente.")
  }

  const bytes = base64ToBytes(raw)
  if (bytes.length !== 32) {
    throw new Error("SMTP_CREDENTIALS_ENCRYPTION_KEY deve representar 32 bytes em base64.")
  }

  return crypto.subtle.importKey("raw", bytes, { name: ALGO }, false, ["encrypt", "decrypt"])
}

export async function encryptSmtpPassword(plaintext: string): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await getEncryptionKey()
  const encoded = new TextEncoder().encode(plaintext)
  const encrypted = await crypto.subtle.encrypt({ name: ALGO, iv }, key, encoded)

  return {
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
    iv: bytesToBase64(iv),
  }
}

export async function decryptSmtpPassword(ciphertext: string, iv: string): Promise<string> {
  const key = await getEncryptionKey()
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGO, iv: base64ToBytes(iv) },
    key,
    base64ToBytes(ciphertext),
  )
  return new TextDecoder().decode(decrypted)
}
