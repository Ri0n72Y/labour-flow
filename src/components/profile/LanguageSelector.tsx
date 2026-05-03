import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react'
import {
  CheckIcon,
  ChevronDownIcon,
  LanguageIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import { languageOptions, type AppLanguage } from '../../i18n/resources'
import { cn } from '../../lib/styles/cn'
import { useSettingsStore } from '../../stores/settingsStore'

export function LanguageSelector() {
  const { t } = useTranslation()
  const language = useSettingsStore((state) => state.language)
  const setLanguage = useSettingsStore((state) => state.setLanguage)
  const selectedLanguage =
    languageOptions.find((option) => option.code === language) ??
    languageOptions[0]

  const handleLanguageChange = (nextLanguage: AppLanguage) => {
    setLanguage(nextLanguage)
    void i18n.changeLanguage(nextLanguage)
    document.documentElement.lang = nextLanguage
  }

  return (
    <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <LanguageIcon className="h-5 w-5 text-teal-700" />
        <div>
          <h2 className="text-base font-semibold text-stone-950">
            {t('user.language')}
          </h2>
          <p className="text-xs text-stone-500">{t('user.languageSubtitle')}</p>
        </div>
      </div>
      <Listbox value={language} onChange={handleLanguageChange}>
        <div className="relative">
          <ListboxButton className="grid h-11 w-full grid-cols-[1fr_auto] items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-3 text-left text-sm font-semibold text-stone-800 outline-none transition hover:bg-white focus:bg-white focus:ring-2 focus:ring-teal-100">
            <span>{selectedLanguage.label}</span>
            <ChevronDownIcon className="h-4 w-4 text-stone-500" />
          </ListboxButton>
          <ListboxOptions
            anchor="bottom start"
            className="z-20 mt-2 w-(--button-width) rounded-md border border-stone-200 bg-white p-1 text-sm shadow-lg outline-none"
            aria-label={t('user.language')}
          >
            {languageOptions.map((option) => (
              <ListboxOption
                key={option.code}
                className={({ focus, selected }) =>
                  cn(
                    'grid cursor-pointer grid-cols-[1fr_auto] items-center gap-2 rounded px-3 py-2 text-stone-700',
                    focus && 'bg-amber-50 text-stone-950',
                    selected && 'font-semibold text-teal-800'
                  )
                }
                value={option.code}
              >
                {({ selected }) => (
                  <>
                    <span>{option.label}</span>
                    {selected && (
                      <CheckIcon className="h-4 w-4 text-teal-700" />
                    )}
                  </>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </Listbox>
    </section>
  )
}
