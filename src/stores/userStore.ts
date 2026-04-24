import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile } from '../interfaces'
import { generateIdentityKeys } from '../utils/crypto'
import { nowIso } from '../utils/time'

interface UserState extends UserProfile {
  generateKeys: () => Promise<void>
  setUid: (uid: string) => void
  setAvatarDataUrl: (avatarDataUrl: string) => void
}

const defaultUid = '劳动者'

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      uid: defaultUid,
      avatarDataUrl: '',
      publicKeyJwk: null,
      privateKeyJwk: null,
      createdAt: null,
      generateKeys: async () => {
        const { publicKeyJwk, privateKeyJwk } = await generateIdentityKeys()
        set({
          publicKeyJwk,
          privateKeyJwk,
          createdAt: get().createdAt ?? nowIso(),
        })
      },
      setUid: (uid) => set({ uid: uid.trim() || defaultUid }),
      setAvatarDataUrl: (avatarDataUrl) => set({ avatarDataUrl }),
    }),
    {
      name: 'labourflow-user',
    }
  )
)
