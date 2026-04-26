import { UserCircleIcon } from '@heroicons/react/24/outline'
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
  return (
    <div className="space-y-4">
      <section className="rounded-md border border-amber-200 bg-amber-50 p-5 text-left shadow-sm">
        <div className="flex items-start gap-3">
          <UserCircleIcon className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" />
          <div>
            <p className="text-base font-semibold text-amber-950">
              先完成注册
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-800">
              劳动流需要先生成本地公钥和私钥，之后才能为劳动记录签名并确认记录属于你。
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
          {registering ? '注册中' : '注册并生成密钥'}
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
