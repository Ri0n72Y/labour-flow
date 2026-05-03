import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import {
  CheckIcon,
  PencilSquareIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProjectSectionId } from '../../lib/project/projectDetail'
import { cn } from '../../lib/styles/cn'

export function EditableProjectSection({
  children,
  editing,
  editor,
  id,
  onCancel,
  onEdit,
  onSave,
  onSelect,
  readOnly = false,
  selected,
  subtitle,
  title,
}: {
  children: ReactNode
  editing: boolean
  editor: ReactNode
  id: ProjectSectionId
  onCancel: () => void
  onEdit: (sectionId: ProjectSectionId) => void
  onSave: (sectionId: ProjectSectionId) => void
  onSelect: (sectionId: ProjectSectionId) => void
  readOnly?: boolean
  selected: boolean
  subtitle?: string
  title: string
}) {
  const { t } = useTranslation()

  return (
    <>
      <section
        className={cn(
          'rounded-md border bg-white p-4 text-left shadow-sm transition',
          selected
            ? 'border-teal-500 ring-2 ring-teal-600/20'
            : 'border-stone-200'
        )}
        tabIndex={0}
        onClick={() => onSelect(id)}
        onKeyDown={(event) => {
          if (event.currentTarget !== event.target) return
          if (event.key !== 'Enter' && event.key !== ' ') return
          event.preventDefault()
          onSelect(id)
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-stone-950">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-xs leading-5 text-stone-500">{subtitle}</p>
            )}
          </div>
          <div className="flex h-9 w-9 shrink-0 justify-end">
            {!readOnly && (selected || editing) ? (
              <button
                aria-label={t('common.editSection', { title })}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-stone-950 text-white transition hover:bg-stone-800"
                title={t('common.editSection', { title })}
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onEdit(id)
                }}
              >
                <PencilSquareIcon className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </div>
        <div className="mt-3 max-h-56 overflow-auto pr-1">{children}</div>
      </section>

      <Dialog className="relative z-50" open={editing} onClose={onCancel}>
        <div className="fixed inset-0 bg-stone-950/35" aria-hidden="true" />
        <div className="fixed inset-0 flex items-end justify-center p-3 sm:items-center">
          <DialogPanel className="w-full max-w-2xl rounded-md bg-white p-4 text-left shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <DialogTitle className="text-base font-semibold text-stone-950">
                {title}
              </DialogTitle>
              <button
                aria-label={t('common.cancelSection', { title })}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-stone-100 text-stone-600 transition hover:bg-stone-200"
                title={t('common.cancelSection', { title })}
                type="button"
                onClick={onCancel}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 max-h-[68vh] overflow-auto pr-1">{editor}</div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white transition hover:bg-teal-800"
                type="button"
                onClick={() => onSave(id)}
              >
                <CheckIcon className="h-5 w-5" />
                {t('common.save')}
              </button>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-stone-100 px-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-200"
                type="button"
                onClick={onCancel}
              >
                <XMarkIcon className="h-5 w-5" />
                {t('common.cancel')}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}
