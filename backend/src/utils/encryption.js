import crypto from 'crypto'
import env from '../config/env.config.js'

const ALGORITHM = 'aes-256-gcm'
const VERSION_PREFIX = 'v1'
const KEY = Buffer.from(env.TOKEN_ENCRYPTION_KEY, 'base64')

export function isEncrypted(value) {
    return typeof value === 'string' && value.startsWith(`${VERSION_PREFIX}:`)
}

export function encrypt(plaintext) {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()

    return [VERSION_PREFIX, iv.toString('hex'), authTag.toString('hex'), ciphertext.toString('hex')].join(':')
}

// Legacy plaintext values (stored before encryption-at-rest was added) are
// returned as-is — callers should re-encrypt them via updateUserGithubtoken
// once read, so the fleet migrates itself without a batch job.
export function decrypt(value) {
    if (!isEncrypted(value)) return value

    const [, ivHex, authTagHex, ciphertextHex] = value.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const ciphertext = Buffer.from(ciphertextHex, 'hex')

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv)
    decipher.setAuthTag(authTag)
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])

    return plaintext.toString('utf8')
}
