import type { LaborData } from '../interfaces'

const base58Alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

const algorithm = {
  name: 'Ed25519',
} as const

export async function generateIdentityKeys() {
  const keyPair = await crypto.subtle.generateKey(algorithm, true, ['sign', 'verify'])
  const [publicKeyJwk, privateKeyJwk] = await Promise.all([
    crypto.subtle.exportKey('jwk', keyPair.publicKey),
    crypto.subtle.exportKey('jwk', keyPair.privateKey),
  ])

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
  const privateKey = await crypto.subtle.importKey('jwk', privateKeyJwk, algorithm, true, ['sign'])
  const data = new TextEncoder().encode(stableStringify(record))
  const signature = await crypto.subtle.sign(algorithm, privateKey, data)
  return arrayBufferToBase64(signature)
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

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
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
