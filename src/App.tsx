import {
  ChartBarIcon,
  FolderIcon,
  PencilSquareIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { type ComponentType, useState } from 'react'
import { UserIdentityBadge } from './components/UserIdentityBadge'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { RecordPage } from './pages/RecordPage'
import { UserPage } from './pages/UserPage'
import { ViewPage } from './pages/ViewPage'

type TabId = 'record' | 'view' | 'projects' | 'user'

const tabs: Array<{
  id: TabId
  label: string
  icon: ComponentType<{ className?: string }>
}> = [
  { id: 'record', label: '记录', icon: PencilSquareIcon },
  { id: 'view', label: '查看', icon: ChartBarIcon },
  { id: 'projects', label: '项目', icon: FolderIcon },
  { id: 'user', label: '我的', icon: UserCircleIcon },
]

const pageTitle: Record<TabId, string> = {
  record: '快速记录',
  view: '劳动记录',
  projects: '项目档案',
  user: '个人档案',
}

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('record')
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

  const openProject = (projectId: string) => {
    setActiveProjectId(projectId)
    setActiveTab('projects')
  }

  return (
    <main className="min-h-svh bg-[#f7f3ea] text-[#1f2933]">
      <div className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-[#fbfaf7] shadow-2xl shadow-stone-300/50">
        <header className="flex items-center justify-between gap-3 border-b border-stone-200 px-5 pb-3 pt-5">
          <div className="min-w-0 text-left">
            <p className="text-xs font-semibold uppercase text-teal-700">
              劳动流 Labour Flow
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-stone-950">
              {activeProjectId ? '项目详情' : pageTitle[activeTab]}
            </h1>
          </div>
          <UserIdentityBadge />
        </header>

        <section className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
          {activeProjectId ? (
            <ProjectDetailPage
              projectId={activeProjectId}
              onBack={() => setActiveProjectId(null)}
            />
          ) : (
            <>
              {activeTab === 'record' && <RecordPage />}
              {activeTab === 'view' && <ViewPage />}
              {activeTab === 'projects' && (
                <ProjectsPage onOpenProject={openProject} />
              )}
              {activeTab === 'user' && <UserPage onOpenProject={openProject} />}
            </>
          )}
        </section>

        <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-stone-200 bg-white/95 px-3 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur">
          <div className="grid grid-cols-4 gap-2">
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
                  <span className="mt-1">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </main>
  )
}

export default App
