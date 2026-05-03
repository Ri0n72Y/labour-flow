import { SparklesIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { formatMinutes } from '../../lib/date'
import type {
  LabourRecord,
  PromptTemplate,
  WeeklyPlan,
  WeeklySnapshot,
} from '../../types/domain'
import { HeadlessTextarea } from '../forms/HeadlessFields'
import { PromptEditor } from '../prompt/PromptEditor'

export function ProjectActivityPanel({
  currentPlan,
  generating,
  isArchived,
  message,
  onGenerateSnapshot,
  onSavePlan,
  onSavePrompt,
  projectPrompt,
  projectRecords,
  projectSnapshots,
}: {
  currentPlan?: WeeklyPlan
  generating: boolean
  isArchived: boolean
  message: string
  onGenerateSnapshot: () => void
  onSavePlan: (planText: string) => void
  onSavePrompt: (content: string) => void
  projectPrompt?: PromptTemplate
  projectRecords: LabourRecord[]
  projectSnapshots: WeeklySnapshot[]
}) {
  const { t } = useTranslation()

  return (
    <>
      {!isArchived ? (
        <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-stone-950">
            {t('projectDetail.weekPlan')}
          </h2>
          <HeadlessTextarea
            className="input mt-3 min-h-28 resize-y"
            value={currentPlan?.planText ?? ''}
            placeholder={t('projectDetail.weekPlanPlaceholder')}
            onChange={(event) => onSavePlan(event.target.value)}
          />
        </section>
      ) : currentPlan?.planText ? (
        <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-stone-950">
            {t('projectDetail.weekPlan')}
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-700">
            {currentPlan.planText}
          </p>
        </section>
      ) : null}

      <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-stone-950">
          {t('projectDetail.projectLog')}
        </h2>
        <div className="mt-3 space-y-3">
          {projectRecords.length === 0 ? (
            <p className="text-sm text-stone-500">
              {t('projectDetail.noRecords')}
            </p>
          ) : (
            projectRecords.map((record) => (
              <article key={record.id} className="rounded-md bg-stone-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-stone-950">
                    {record.date}
                  </span>
                  <span className="text-xs text-stone-500">
                    {formatMinutes(record.durationMinutes)}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">
                  {record.content}
                </p>
              </article>
            ))
          )}
        </div>
      </section>

      {!isArchived ? (
        <PromptEditor prompt={projectPrompt} onSave={onSavePrompt} />
      ) : null}

      <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-stone-950">
            {t('projectDetail.weeklySnapshot')}
          </h2>
          {!isArchived ? (
            <button
              className="flex h-9 items-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white disabled:bg-stone-300"
              disabled={generating}
              type="button"
              onClick={onGenerateSnapshot}
            >
              <SparklesIcon className="h-4 w-4" />
              {generating
                ? t('projectDetail.generating')
                : t('projectDetail.localGenerate')}
            </button>
          ) : null}
        </div>
        <div className="mt-3 space-y-3">
          {projectSnapshots.map((snapshot) => (
            <article key={snapshot.id} className="rounded-md bg-stone-50 p-3">
              <p className="text-xs font-semibold text-stone-500">
                {snapshot.weekStart} ~ {snapshot.weekEnd}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">
                {snapshot.content}
              </p>
            </article>
          ))}
        </div>
        {message && (
          <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        )}
      </section>
    </>
  )
}
