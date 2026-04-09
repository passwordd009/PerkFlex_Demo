import { createHmac, timingSafeEqual } from 'crypto'

const SECRET = process.env.QR_HMAC_SECRET
if (!SECRET) throw new Error('QR_HMAC_SECRET env var is required')

/**
 * Sign a QR payload: `orderId:userId:timestamp`
 * Returns a URL-safe token: `<payload>.<signature>`
 */
export function signQRToken(orderId: string, userId: string): string {
  const timestamp = Date.now().toString()
  const payload = `${orderId}:${userId}:${timestamp}`
  const sig = createHmac('sha256', SECRET!).update(payload).digest('base64url')
  return `${Buffer.from(payload).toString('base64url')}.${sig}`
}

export interface QRPayload {
  orderId: string
  userId: string
  timestamp: number
}

/**
 * Verify a QR token.
 * Returns the decoded payload or throws if invalid/expired.
 */
export function verifyQRToken(token: string, maxAgeMs = 24 * 60 * 60 * 1000): QRPayload {
  const parts = token.split('.')
  if (parts.length !== 2) throw new Error('Invalid QR token format')

  const [encodedPayload, providedSig] = parts
  const expectedSig = createHmac('sha256', SECRET!).update(
    Buffer.from(encodedPayload, 'base64url').toString()
  ).digest('base64url')

  // Constant-time comparison to prevent timing attacks
  const sigBuf = Buffer.from(providedSig, 'base64url')
  const expectedBuf = Buffer.from(expectedSig, 'base64url')
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    throw new Error('Invalid QR token signature')
  }

  const payload = Buffer.from(encodedPayload, 'base64url').toString()
  const [orderId, userId, timestampStr] = payload.split(':')

  if (!orderId || !userId || !timestampStr) {
    throw new Error('Malformed QR token payload')
  }

  const timestamp = parseInt(timestampStr, 10)
  if (Date.now() - timestamp > maxAgeMs) {
    throw new Error('QR token has expired')
  }

  return { orderId, userId, timestamp }
}
