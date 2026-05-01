import * as ed25519 from '@noble/ed25519'
import { sha512 } from '@noble/hashes/sha2.js'
import type { LaborData } from '../interfaces'

const base58Alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

ed25519.hashes.sha512 = sha512
ed25519.hashes.sha512Async = async (message: Uint8Array) => sha512(message)

export async function generateIdentityKeys() {
  const { secretKey, publicKey } = ed25519.keygen()
  const publicKeyJwk = createEd25519PublicJwk(publicKey)
  const privateKeyJwk = createEd25519PrivateJwk(secretKey, publicKey)

  return { publicKeyJwk, privateKeyJwk }
}

export function publicKeyLabel(publicKeyJwk: JsonWebKey | null) {
  if (!publicKeyJwk) return '未生成'
  if (typeof publicKeyJwk.x === 'string') return base58Encode(base64UrlToBytes(publicKeyJwk.x)).slice(0, 8)
  return stableStringify(publicKeyJwk).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || '00000000'
}

export function publicKeyPayload(publicKeyJwk: JsonWebKey | null) {
  return publicKeyJwk ? stableStringify(publicKeyJwk) : ''
}

export async function signLaborRecord(record: Omit<LaborData, 'signature'>, privateKeyJwk: JsonWebKey) {
  const data = new TextEncoder().encode(stableStringify(record))
  const secretKey = privateJwkToEd25519SecretKey(privateKeyJwk)
  const signature = ed25519.sign(data, secretKey)
  return bytesToBase64(signature)
}

export function isEd25519KeyPair(
  publicKeyJwk: JsonWebKey | null,
  privateKeyJwk: JsonWebKey | null,
) {
  return isEd25519Key(publicKeyJwk) && isEd25519Key(privateKeyJwk)
}

function isEd25519Key(key: JsonWebKey | null) {
  return key?.kty === 'OKP' && key.crv === 'Ed25519'
}

function createEd25519PublicJwk(publicKey: Uint8Array): JsonWebKey {
  return {
    kty: 'OKP',
    crv: 'Ed25519',
    x: bytesToBase64Url(publicKey),
    ext: true,
    key_ops: ['verify'],
  }
}

function createEd25519PrivateJwk(secretKey: Uint8Array, publicKey: Uint8Array): JsonWebKey {
  return {
    ...createEd25519PublicJwk(publicKey),
    d: bytesToBase64Url(secretKey),
    key_ops: ['sign'],
  }
}

function privateJwkToEd25519SecretKey(privateKeyJwk: JsonWebKey) {
  if (!isEd25519Key(privateKeyJwk)) throw new Error('Invalid Ed25519 private key')
  if (typeof privateKeyJwk.d !== 'string') throw new Error('Invalid Ed25519 private key')
  return base64UrlToBytes(privateKeyJwk.d)
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))

  return `{${entries
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
    .join(',')}}`
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function bytesToBase64Url(bytes: Uint8Array) {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(base64)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function base58Encode(bytes: Uint8Array) {
  if (bytes.length === 0) return ''

  const digits = [0]
  for (const byte of bytes) {
    let carry = byte
    for (let index = 0; index < digits.length; index += 1) {
      carry += digits[index] * 256
      digits[index] = carry % 58
      carry = Math.floor(carry / 58)
    }
    while (carry > 0) {
      digits.push(carry % 58)
      carry = Math.floor(carry / 58)
    }
  }

  for (const byte of bytes) {
    if (byte !== 0) break
    digits.push(0)
  }

  return digits.reverse().map((digit) => base58Alphabet[digit]).join('')
}
