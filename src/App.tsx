import {
  FolderIcon,
  PencilSquareIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { type ComponentType, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserIdentityBadge } from './components/UserIdentityBadge'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { RecordPage } from './pages/RecordPage'
import { UserPage } from './pages/UserPage'
import { useUserStore } from './stores/userStore'
import { isEd25519KeyPair } from './utils/crypto'

type TabId = 'record' | 'projects' | 'user'

const tabs: Array<{
  id: TabId
  labelKey: string
  icon: ComponentType<{ className?: string }>
}> = [
  { id: 'record', labelKey: 'app.tabs.record', icon: PencilSquareIcon },
  { id: 'projects', labelKey: 'app.tabs.projects', icon: FolderIcon },
  { id: 'user', labelKey: 'app.tabs.user', icon: UserCircleIcon },
]

const pageTitle: Record<TabId, string> = {
  record: 'app.titles.record',
  projects: 'app.titles.projects',
  user: 'app.titles.user',
}

function App() {
  const { t } = useTranslation()
  const publicKeyJwk = useUserStore((state) => state.publicKeyJwk)
  const privateKeyJwk = useUserStore((state) => state.privateKeyJwk)
  const [activeTab, setActiveTab] = useState<TabId>('record')
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const hasKeys = isEd25519KeyPair(publicKeyJwk, privateKeyJwk)
  const showUserShortcut = hasKeys && activeTab !== 'user'

  const openProject = (projectId: string) => {
    setActiveProjectId(projectId)
    setActiveTab('projects')
  }

  const openUserPage = () => {
    if (!activeProjectId && activeTab === 'user') return
    setActiveProjectId(null)
    setActiveTab('user')
  }

  return (
    <main className="min-h-svh bg-[#f7f3ea] text-[#1f2933]">
      <div className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-[#fbfaf7] shadow-2xl shadow-stone-300/50">
        <header className="flex items-center justify-between gap-3 border-b border-stone-200 px-5 pb-3 pt-5">
          <div className="min-w-0 text-left">
            <p className="text-xs font-semibold uppercase text-teal-700">
              {t('app.brand')}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-stone-950">
              {activeProjectId ? t('app.projectDetail') : t(pageTitle[activeTab])}
            </h1>
          </div>
          {showUserShortcut && <UserIdentityBadge onOpenUser={openUserPage} />}
        </header>

        <section
          className={`flex-1 overflow-y-auto px-4 pt-4 ${
            hasKeys ? 'pb-24' : 'pb-4'
          }`}
        >
          {activeProjectId ? (
            <ProjectDetailPage
              projectId={activeProjectId}
              onBack={() => setActiveProjectId(null)}
            />
          ) : (
            <>
              {activeTab === 'record' && <RecordPage />}
              {activeTab === 'projects' && (
                <ProjectsPage onOpenProject={openProject} />
              )}
              {activeTab === 'user' && <UserPage onOpenProject={openProject} />}
            </>
          )}
        </section>

        {hasKeys && (
          <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-stone-200 bg-white/95 px-3 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur">
            <div className="grid grid-cols-3 gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const active = !activeProjectId && activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    className={`flex h-14 flex-col items-center justify-center rounded-md text-xs font-medium transition ${
                      active
                        ? 'bg-teal-700 text-white'
                        : 'text-stone-500 hover:bg-stone-100'
                    }`}
                    type="button"
                    onClick={() => {
                      setActiveProjectId(null)
                      setActiveTab(tab.id)
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="mt-1">{t(tab.labelKey)}</span>
                  </button>
                )
              })}
            </div>
          </nav>
        )}
      </div>
    </main>
  )
}

export default App
