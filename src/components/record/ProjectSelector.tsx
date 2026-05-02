import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react'
import {
  CheckIcon,
  ChevronDownIcon,
  FolderIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { cn } from '../../lib/styles/cn'
import type { Project } from '../../types/domain'

export function ProjectSelector({
  projects,
  selectedProjectId,
  onChange,
  onCreate,
}: {
  projects: Project[]
  selectedProjectId: string
  onChange: (projectId: string) => void
  onCreate: () => void
}) {
  const selectedProject = projects.find(
    (project) => project.id === selectedProjectId
  )
  const selectedProjectTitle = selectedProject?.title ?? '默认劳动项目'

  return (
    <section className="notebook-paper grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-amber-200 p-3 text-left shadow-sm">
      <div className="contents">
        <FolderIcon className="h-4 w-4 text-teal-700" />
        <h2 className="text-base font-semibold text-stone-950">项目</h2>
      </div>
      <Listbox value={selectedProjectId} onChange={onChange}>
        <div className="relative min-w-0">
          <ListboxButton className="grid h-9 w-full grid-cols-[1fr_auto] items-center gap-2 rounded-md border border-none bg-white/50 py-0 pl-3 pr-3 text-left text-sm font-semibold text-stone-800 outline-none transition hover:bg-white/80 focus:bg-white/80 ">
            <span className="truncate">{selectedProjectTitle}</span>
            <ChevronDownIcon className="h-4 w-4 text-stone-500" />
          </ListboxButton>
          <ListboxOptions
            anchor="bottom start"
            className="z-20 mt-2 max-h-56 w-(--button-width) overflow-y-auto rounded-md border border-amber-200 bg-white p-1 text-sm shadow-lg outline-none"
            aria-label="选择项目"
          >
            {projects.length === 0 && (
              <ListboxOption
                className={({ focus }) =>
                  cn(
                    'grid cursor-pointer grid-cols-[1fr_auto] items-center gap-2 rounded px-3 py-2 text-stone-700',
                    focus && 'bg-amber-50 text-stone-950'
                  )
                }
                value=""
              >
                <span className="truncate">默认劳动项目</span>
                <CheckIcon className="h-4 w-4 text-teal-700" />
              </ListboxOption>
            )}
            {projects.map((project) => (
              <ListboxOption
                key={project.id}
                className={({ focus, selected }) =>
                  cn(
                    'grid cursor-pointer grid-cols-[1fr_auto] items-center gap-2 rounded px-3 py-2 text-stone-700',
                    focus && 'bg-amber-50 text-stone-950',
                    selected && 'font-semibold text-teal-800'
                  )
                }
                value={project.id}
              >
                {({ selected }) => (
                  <>
                    <span className="truncate">{project.title}</span>
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
      <button
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-teal-700 transition hover:bg-teal-50"
        type="button"
        onClick={onCreate}
        aria-label="新建项目"
      >
        <PlusIcon className="h-5 w-5" />
      </button>
    </section>
  )
}
