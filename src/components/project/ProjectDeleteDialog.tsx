import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

export function ProjectDeleteDialog({
  open,
  projectTitle,
  onCancel,
  onConfirm,
}: {
  open: boolean
  projectTitle: string
  onCancel: () => void
  onConfirm: () => void
}) {
  const { t } = useTranslation()

  return (
    <Dialog className="relative z-50" open={open} onClose={onCancel}>
      <div className="fixed inset-0 bg-stone-950/35" aria-hidden="true" />
      <div className="fixed inset-0 flex items-end justify-center p-3 sm:items-center">
        <DialogPanel className="w-full max-w-md rounded-md bg-white p-4 text-left shadow-xl">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-700">
              <ExclamationTriangleIcon className="h-6 w-6" />
            </span>
            <div>
              <DialogTitle className="text-base font-semibold text-stone-950">
                {t('projectDetail.deleteConfirmTitle')}
              </DialogTitle>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {t('projectDetail.deleteConfirmBody', {
                  title: projectTitle,
                })}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              className="h-10 rounded-md bg-red-600 px-3 text-sm font-semibold text-white"
              type="button"
              onClick={onConfirm}
            >
              {t('projectDetail.confirmDelete')}
            </button>
            <button
              className="h-10 rounded-md bg-stone-100 px-3 text-sm font-semibold text-stone-700"
              type="button"
              onClick={onCancel}
            >
              {t('common.cancel')}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
