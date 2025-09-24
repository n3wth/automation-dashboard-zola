import { cookies } from "next/headers"

const CSRF_SECRET = process.env.CSRF_SECRET!

// Use Web Crypto API for Edge Runtime compatibility
async function getRandomBytes(length: number): Promise<Uint8Array> {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Edge Runtime and modern browsers
    return crypto.getRandomValues(new Uint8Array(length))
  } else {
    // Node.js fallback
    const { randomBytes } = await import("node:crypto")
    return new Uint8Array(randomBytes(length))
  }
}

async function createSHA256Hash(data: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    // Edge Runtime and modern browsers
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = new Uint8Array(hashBuffer)
    return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('')
  } else {
    // Node.js fallback
    const { createHash } = await import("node:crypto")
    return createHash("sha256").update(data).digest("hex")
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function generateCsrfToken(): Promise<string> {
  const rawBytes = await getRandomBytes(32)
  const raw = bytesToHex(rawBytes)
  const token = await createSHA256Hash(`${raw}${CSRF_SECRET}`)
  return `${raw}:${token}`
}

export async function validateCsrfToken(fullToken: string): Promise<boolean> {
  const [raw, token] = fullToken.split(":")
  if (!raw || !token) return false
  const expected = await createSHA256Hash(`${raw}${CSRF_SECRET}`)
  return expected === token
}

export async function setCsrfCookie() {
  const cookieStore = await cookies()
  const token = await generateCsrfToken()
  cookieStore.set("csrf_token", token, {
    httpOnly: false,
    secure: true,
    path: "/",
  })
}
