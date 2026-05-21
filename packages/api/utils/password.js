import bcrypt from 'bcryptjs'
import CryptoJS from 'crypto-js'

const BCRYPT_ROUNDS = 12

export async function hashPassword(plaintext) {
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS)
}

// Returns true if passwords match. If a legacy hash matched, also returns the
// new bcrypt hash so the caller can migrate the stored password.
export async function verifyPassword(plaintext, storedHash) {
  if (storedHash.startsWith('$2')) {
    const match = await bcrypt.compare(plaintext, storedHash)
    return { match, migratedHash: null }
  }

  const hmacHash = CryptoJS.HmacSHA256(plaintext, process.env.PASSWORD_HASH_SECRET).toString(CryptoJS.enc.Hex)
  const legacyHash = CryptoJS.SHA256(plaintext).toString(CryptoJS.enc.Hex)

  if (storedHash === hmacHash || storedHash === legacyHash) {
    const migratedHash = await hashPassword(plaintext)
    return { match: true, migratedHash }
  }

  return { match: false, migratedHash: null }
}
