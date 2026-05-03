import { UserCircleIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { KeyIcon } from '../icons/KeyIcon'

export function RegistrationGate({
  registering,
  message,
  onRegister,
}: {
  registering: boolean
  message: string
  onRegister: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-amber-200 bg-amber-50 p-5 text-left shadow-sm">
        <div className="flex items-start gap-3">
          <UserCircleIcon className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" />
          <div>
            <p className="text-base font-semibold text-amber-950">
              {t('record.registration.title')}
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-800">
              {t('record.registration.body')}
            </p>
          </div>
        </div>
        <button
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white disabled:bg-stone-300"
          disabled={registering}
          type="button"
          onClick={onRegister}
        >
          <KeyIcon />
          {registering ? t('record.registration.registering') : t('record.registration.button')}
        </button>
      </section>
      {message && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-left text-sm text-amber-800">
          {message}
        </p>
      )}
    </div>
  )
}
