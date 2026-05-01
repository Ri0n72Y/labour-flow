import { beforeEach, describe, expect, it } from 'vitest'
import { useUserStore } from '../../src/stores/userStore'
import { resetStores } from '../test-utils'

describe('useUserStore', () => {
  beforeEach(() => {
    resetStores()
  })

  it('trims uid input and preserves the default value when empty', () => {
    const defaultUid = useUserStore.getState().uid

    useUserStore.getState().setUid('  Alice  ')
    expect(useUserStore.getState().uid).toBe('Alice')

    useUserStore.getState().setUid('   ')
    expect(useUserStore.getState().uid).toBe(defaultUid)
  })

  it('stores avatars and generates an Ed25519 key pair', async () => {
    await useUserStore.getState().generateKeys()
    const state = useUserStore.getState()

    expect(state.publicKeyJwk).toMatchObject({
      kty: 'OKP',
      crv: 'Ed25519',
    })
    expect(state.privateKeyJwk).toMatchObject({
      kty: 'OKP',
      crv: 'Ed25519',
    })
    expect(state.createdAt).toBeTruthy()

    state.setAvatarDataUrl('data:image/png;base64,abc')
    expect(useUserStore.getState().avatarDataUrl).toBe('data:image/png;base64,abc')
  })
})
