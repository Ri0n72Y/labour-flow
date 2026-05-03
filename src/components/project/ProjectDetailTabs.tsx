import { useTranslation } from 'react-i18next'
import {
  detailPanels,
  type DetailPanelId,
} from '../../lib/project/projectDetail'
import { cn } from '../../lib/styles/cn'

export function ProjectDetailTabs({
  activePanel,
  onChange,
}: {
  activePanel: DetailPanelId
  onChange: (panelId: DetailPanelId) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-3 gap-2 rounded-md bg-stone-100 p-1">
      {detailPanels.map((panel) => (
        <button
          key={panel.id}
          className={cn(
            'h-9 rounded-md text-sm font-semibold transition',
            activePanel === panel.id
              ? 'bg-white text-stone-950 shadow-sm'
              : 'text-stone-500 hover:text-stone-800'
          )}
          type="button"
          onClick={() => onChange(panel.id)}
        >
          {t(panel.labelKey)}
        </button>
      ))}
    </div>
  )
}
