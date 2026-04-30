import * as ed25519 from '@noble/ed25519'
import { describe, expect, it } from 'vitest'
import {
  generateIdentityKeys,
  isEd25519KeyPair,
  publicKeyLabel,
  publicKeyPayload,
  signLaborRecord,
  stableStringify,
} from '../../src/utils/crypto'
import type { LaborData } from '../../src/interfaces'

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
}

describe('crypto helpers', () => {
  it('serializes objects in a stable order', () => {
    expect(stableStringify({ b: 2, a: 1, skip: undefined })).toBe(
      '{"a":1,"b":2}',
    )
    expect(stableStringify([1, { z: 2, y: 1 }])).toBe('[1,{"y":1,"z":2}]')
  })

  it('labels and identifies Ed25519 keys', async () => {
    const { publicKeyJwk, privateKeyJwk } = await generateIdentityKeys()

    expect(isEd25519KeyPair(publicKeyJwk, privateKeyJwk)).toBe(true)
    expect(publicKeyPayload(publicKeyJwk)).toContain('"crv":"Ed25519"')
    expect(publicKeyLabel(publicKeyJwk)).toMatch(/^[1-9A-HJ-NP-Za-km-z]{8}$/)
  })

  it('signs records with the generated private key', async () => {
    const { publicKeyJwk, privateKeyJwk } = await generateIdentityKeys()
    const record: Omit<LaborData, 'signature'> = {
      wid: 'wid-1',
      startAt: '2026-04-30T00:00:00.000Z',
      endAt: '2026-04-30T01:00:00.000Z',
      duration: 3600,
      createBy: publicKeyPayload(publicKeyJwk),
      createAt: '2026-04-30T01:00:00.000Z',
      outcome: '',
      description: '- ship tests',
      tags: ['tests'],
    }

    const signature = await signLaborRecord(record, privateKeyJwk!)
    const signatureBytes = Uint8Array.from(atob(signature), (char) => char.charCodeAt(0))

    expect(signature).toMatch(/^[A-Za-z0-9+/=]+$/)
    await expect(
      ed25519.verifyAsync(
        signatureBytes,
        new TextEncoder().encode(stableStringify(record)),
        base64UrlToBytes(publicKeyJwk!.x as string),
      ),
    ).resolves.toBe(true)
  })
})
