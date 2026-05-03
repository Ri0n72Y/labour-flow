import { UserCircleIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { useUserStore } from '../stores/userStore'
import { isEd25519KeyPair, publicKeyLabel } from '../utils/crypto'

export function UserIdentityBadge() {
  const { t } = useTranslation()
  const uid = useUserStore((state) => state.uid)
  const avatarDataUrl = useUserStore((state) => state.avatarDataUrl)
  const publicKeyJwk = useUserStore((state) => state.publicKeyJwk)
  const privateKeyJwk = useUserStore((state) => state.privateKeyJwk)
  const hasKeys = isEd25519KeyPair(publicKeyJwk, privateKeyJwk)
  const displayId = `${uid || t('common.worker')}#${publicKeyLabel(publicKeyJwk)}`

  if (!hasKeys) {
    return (
      <div
        className="flex h-9 shrink-0 items-center gap-2 rounded-full px-3 text-xs text-stone-500 ring-1 ring-stone-200 opacity-70"
        title={t('user.unregistered')}
      >
        <UserCircleIcon className="h-5 w-5" />
        {t('user.unregistered')}
      </div>
    )
  }

  return (
    <div
      className="flex min-w-0 max-w-[46%] items-center gap-2 rounded-full bg-white px-2 py-1 shadow-sm ring-1 ring-stone-200"
      title={displayId}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-100">
        {avatarDataUrl ? (
          <img
            className="h-full w-full object-cover"
            src={avatarDataUrl}
            alt={t('user.avatarAlt')}
          />
        ) : (
          <UserCircleIcon className="h-5 w-5 text-stone-400" />
        )}
      </div>
      <span className="min-w-0 truncate text-sm font-extralight text-stone-500">
        {displayId}
      </span>
    </div>
  )
}
