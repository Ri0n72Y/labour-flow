import {
  markdownListLines,
  type MarkdownListStyle,
} from '../lib/markdown/listRendering'
import { useTranslation } from 'react-i18next'

export function MarkdownList({
  text,
  listStyle,
}: {
  text: string
  listStyle?: MarkdownListStyle
}) {
  const { t } = useTranslation()
  void listStyle
  const lines = markdownListLines(text)

  if (lines.length === 0) {
    return <p className="text-sm text-stone-500">{t('common.noContent')}</p>
  }

  return (
    <div className="space-y-1 text-sm leading-6 text-stone-800">
      {lines.map((line, index) => (
        <div
          key={`${line.content}-${index}`}
          className="grid grid-cols-[0.5rem_1fr] gap-1"
          style={{ paddingLeft: `${line.level * 1.25}rem` }}
        >
          <span className="text-right font-medium text-stone-500">
            {line.marker}
          </span>
          <span>{line.content}</span>
        </div>
      ))}
    </div>
  )
}
