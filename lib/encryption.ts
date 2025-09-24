import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

const ALGORITHM = "aes-256-gcm"

function getEncryptionKey() {
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
  if (!ENCRYPTION_KEY) {
    // During build time, we might not have the real key
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE) {
      throw new Error("ENCRYPTION_KEY is required in production")
    }
    // Return a dummy key for build time
    return Buffer.alloc(32)
  }

  const key = Buffer.from(ENCRYPTION_KEY, "base64")

  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be 32 bytes long")
  }

  return key
}

export function encryptKey(plaintext: string): {
  encrypted: string
  iv: string
} {
  const key = getEncryptionKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, "utf8", "hex")
  encrypted += cipher.final("hex")

  const authTag = cipher.getAuthTag()
  const encryptedWithTag = encrypted + ":" + authTag.toString("hex")

  return {
    encrypted: encryptedWithTag,
    iv: iv.toString("hex"),
  }
}

export function decryptKey(encryptedData: string, ivHex: string): string {
  const key = getEncryptionKey()
  const [encrypted, authTagHex] = encryptedData.split(":")
  const iv = Buffer.from(ivHex, "hex")
  const authTag = Buffer.from(authTagHex, "hex")

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}

export function maskKey(key: string): string {
  if (key.length <= 8) {
    return "*".repeat(key.length)
  }
  return key.slice(0, 4) + "*".repeat(key.length - 8) + key.slice(-4)
}
