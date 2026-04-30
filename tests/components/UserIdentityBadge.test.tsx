import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { UserIdentityBadge } from '../../src/components/UserIdentityBadge'
import { resetStores } from '../test-utils'
import { useUserStore } from '../../src/stores/userStore'

describe('UserIdentityBadge', () => {
  it('shows the unregistered state when no key pair exists', () => {
    resetStores()

    render(<UserIdentityBadge />)

    expect(screen.getByText('未注册')).toBeInTheDocument()
  })

  it('shows the display id and avatar when the user is registered', () => {
    resetStores()
    useUserStore.setState({
      uid: 'Alice',
      avatarDataUrl: 'data:image/png;base64,abc',
      publicKeyJwk: {
        kty: 'OKP',
        crv: 'Ed25519',
        x: 'AQIDBAUGBwgJCgsM',
        ext: true,
        key_ops: ['verify'],
      },
      privateKeyJwk: {
        kty: 'OKP',
        crv: 'Ed25519',
        x: 'AQIDBAUGBwgJCgsM',
        d: 'AQIDBAUGBwgJCgsM',
        ext: true,
        key_ops: ['sign'],
      },
      createdAt: '2026-04-30T00:00:00.000Z',
      generateKeys: useUserStore.getState().generateKeys,
      setUid: useUserStore.getState().setUid,
      setAvatarDataUrl: useUserStore.getState().setAvatarDataUrl,
    })

    render(<UserIdentityBadge />)

    expect(screen.getByTitle(/Alice#/)).toBeInTheDocument()
    expect(screen.getByAltText('用户头像')).toBeInTheDocument()
  })
})
