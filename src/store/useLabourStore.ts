import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { exportProjectToMarkdown, parseProjectMarkdown } from '../lib/markdown/projectMarkdown'
import { getWeekRange } from '../lib/date'
import {
  currentWeekDuration,
  deriveBadges,
  getActiveDaysInRange,
  getCurrentStreak,
  getProjectRecentProgress,
  getTotalDuration,
} from '../lib/stats/labourStats'
import type {
  LabourRecord,
  Project,
  ProjectStats,
  PromptTemplate,
  UserProfile,
  UserStats,
  WeeklyPlan,
  WeeklySnapshot,
} from '../types/domain'

type ProjectInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
type LabourRecordInput = Omit<LabourRecord, 'id' | 'createdAt' | 'updatedAt'>
type WeeklyPlanInput = Omit<WeeklyPlan, 'id' | 'createdAt' | 'updatedAt'>
type WeeklySnapshotInput = Omit<WeeklySnapshot, 'id'>
type PromptInput = Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>

interface LabourStoreState {
  userProfile: UserProfile
  projects: Project[]
  labourRecords: LabourRecord[]
  weeklyPlans: WeeklyPlan[]
  weeklySnapshots: WeeklySnapshot[]
  promptTemplates: PromptTemplate[]
  badges: ReturnType<typeof deriveBadges>
  lastImportError?: string
  updateUserProfile: (profile: Partial<UserProfile>) => void
  createProject: (project: ProjectInput) => Project
  updateProject: (id: string, project: Partial<Project>) => void
  archiveProject: (id: string) => void
  addLabourRecord: (record: LabourRecordInput) => LabourRecord
  updateLabourRecord: (id: string, record: Partial<LabourRecord>) => void
  deleteLabourRecord: (id: string) => void
  addWeeklyPlan: (plan: WeeklyPlanInput) => WeeklyPlan
  updateWeeklyPlan: (id: string, plan: Partial<WeeklyPlan>) => void
  addWeeklySnapshot: (snapshot: WeeklySnapshotInput) => WeeklySnapshot
  updateWeeklySnapshot: (id: string, snapshot: Partial<WeeklySnapshot>) => void
  upsertPromptTemplate: (prompt: PromptInput & { id?: string }) => PromptTemplate
  importMarkdownProject: (markdown: string, projectId?: string) => Project | null
  exportProjectToMarkdown: (projectId: string) => string
  computeUserStats: () => UserStats
  computeProjectStats: (projectId: string) => ProjectStats
}

const now = () => new Date().toISOString()
const createId = () => crypto.randomUUID()

const defaultProject = (): Project => {
  const timestamp = now()
  return {
    id: createId(),
    title: '个人劳动档案',
    description: '持续记录每天真实推进的工作。',
    direction: '把劳动过程变得可见、可复盘、可展示。',
    hypothesis: '稳定记录比复杂管理更能证明持续劳动。',
    completionCriteria: '形成连续记录、周小结和可分享的项目文档。',
    backlog: ['完善本周计划', '补充项目背景', '导出标记文档给他人查看'],
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

const defaultPrompt = (): PromptTemplate => {
  const timestamp = now()
  return {
    id: createId(),
    name: '默认周总结提示词',
    scope: 'global',
    content:
      '请基于本周劳动记录，总结实际完成、关键进展、遇到的问题、持续性证据和下周最小行动。',
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function refreshBadges(state: Pick<LabourStoreState, 'labourRecords' | 'weeklySnapshots'>) {
  return deriveBadges(state.labourRecords, state.weeklySnapshots)
}

export const useLabourStore = create<LabourStoreState>()(
  persist(
    (set, get) => {
      const project = defaultProject()
      return {
        userProfile: {
          id: createId(),
          displayName: '劳动者',
          bio: '用持续记录证明真实劳动。',
          mainDirection: '持续劳动展示',
          createdAt: now(),
        },
        projects: [project],
        labourRecords: [],
        weeklyPlans: [],
        weeklySnapshots: [],
        promptTemplates: [defaultPrompt()],
        badges: [],
        updateUserProfile: (profile) =>
          set((state) => ({
            userProfile: { ...state.userProfile, ...profile },
          })),
        createProject: (projectInput) => {
          const timestamp = now()
          const project = {
            ...projectInput,
            id: createId(),
            createdAt: timestamp,
            updatedAt: timestamp,
          }
          set((state) => ({ projects: [project, ...state.projects] }))
          return project
        },
        updateProject: (id, projectInput) =>
          set((state) => ({
            projects: state.projects.map((project) =>
              project.id === id
                ? { ...project, ...projectInput, updatedAt: now() }
                : project,
            ),
          })),
        archiveProject: (id) =>
          set((state) => ({
            projects: state.projects.map((project) =>
              project.id === id
                ? { ...project, isArchived: true, updatedAt: now() }
                : project,
            ),
          })),
        addLabourRecord: (recordInput) => {
          const timestamp = now()
          const record = {
            ...recordInput,
            id: createId(),
            createdAt: timestamp,
            updatedAt: timestamp,
          }
          set((state) => {
            const next = { ...state, labourRecords: [record, ...state.labourRecords] }
            return { labourRecords: next.labourRecords, badges: refreshBadges(next) }
          })
          return record
        },
        updateLabourRecord: (id, recordInput) =>
          set((state) => {
            const labourRecords = state.labourRecords.map((record) =>
              record.id === id
                ? { ...record, ...recordInput, updatedAt: now() }
                : record,
            )
            return {
              labourRecords,
              badges: refreshBadges({ ...state, labourRecords }),
            }
          }),
        deleteLabourRecord: (id) =>
          set((state) => {
            const labourRecords = state.labourRecords.filter((record) => record.id !== id)
            return {
              labourRecords,
              badges: refreshBadges({ ...state, labourRecords }),
            }
          }),
        addWeeklyPlan: (planInput) => {
          const timestamp = now()
          const plan = {
            ...planInput,
            id: createId(),
            createdAt: timestamp,
            updatedAt: timestamp,
          }
          set((state) => ({ weeklyPlans: [plan, ...state.weeklyPlans] }))
          return plan
        },
        updateWeeklyPlan: (id, planInput) =>
          set((state) => ({
            weeklyPlans: state.weeklyPlans.map((plan) =>
              plan.id === id ? { ...plan, ...planInput, updatedAt: now() } : plan,
            ),
          })),
        addWeeklySnapshot: (snapshotInput) => {
          const snapshot = { ...snapshotInput, id: createId() }
          set((state) => {
            const next = {
              ...state,
              weeklySnapshots: [snapshot, ...state.weeklySnapshots],
            }
            return {
              weeklySnapshots: next.weeklySnapshots,
              badges: refreshBadges(next),
            }
          })
          return snapshot
        },
        updateWeeklySnapshot: (id, snapshotInput) =>
          set((state) => {
            const weeklySnapshots = state.weeklySnapshots.map((snapshot) =>
              snapshot.id === id ? { ...snapshot, ...snapshotInput } : snapshot,
            )
            return {
              weeklySnapshots,
              badges: refreshBadges({ ...state, weeklySnapshots }),
            }
          }),
        upsertPromptTemplate: (promptInput) => {
          const timestamp = now()
          const prompt = {
            ...promptInput,
            id: promptInput.id ?? createId(),
            createdAt: timestamp,
            updatedAt: timestamp,
          }
          set((state) => {
            const exists = state.promptTemplates.some((item) => item.id === prompt.id)
            return {
              promptTemplates: exists
                ? state.promptTemplates.map((item) =>
                    item.id === prompt.id
                      ? { ...item, ...promptInput, updatedAt: timestamp }
                      : item,
                  )
                : [prompt, ...state.promptTemplates],
            }
          })
          return prompt
        },
        importMarkdownProject: (markdown, projectId) => {
          try {
            const parsed = parseProjectMarkdown(markdown)
            const timestamp = now()
            const existing = projectId
              ? get().projects.find((project) => project.id === projectId)
              : undefined
            const project: Project = existing
              ? { ...existing, ...parsed.project, updatedAt: timestamp }
              : {
                  id: createId(),
                  title: parsed.project.title || '导入的项目',
                  description: parsed.project.description,
                  direction: parsed.project.direction,
                  hypothesis: parsed.project.hypothesis,
                  completionCriteria: parsed.project.completionCriteria,
                  backlog: parsed.project.backlog,
                  createdAt: timestamp,
                  updatedAt: timestamp,
                }
            const { weekStart, weekEnd } = getWeekRange()
            const records = parsed.records.map((record) => ({
              id: createId(),
              projectId: project.id,
              date: record.date || timestamp.slice(0, 10),
              content: record.content || '从标记文档导入的劳动记录',
              durationMinutes: record.durationMinutes ?? 0,
              createdAt: timestamp,
              updatedAt: timestamp,
            }))
            const weeklyPlans = parsed.weeklyPlans.map((plan) => ({
              id: createId(),
              projectId: project.id,
              weekStart: plan.weekStart || weekStart,
              weekEnd: plan.weekEnd || weekEnd,
              planText: plan.planText || '',
              createdAt: timestamp,
              updatedAt: timestamp,
            }))
            const weeklySnapshots = parsed.weeklySnapshots.map((snapshot) => ({
              id: createId(),
              projectId: project.id,
              weekStart: snapshot.weekStart || weekStart,
              weekEnd: snapshot.weekEnd || weekEnd,
              prompt: snapshot.prompt || '',
              content: snapshot.content || '',
              editedAt: timestamp,
            }))
            const promptTemplates = parsed.promptTemplates.map((prompt) => ({
              id: createId(),
              name: prompt.name || '导入的周总结提示词',
              content: prompt.content || '',
              scope: 'project' as const,
              projectId: project.id,
              createdAt: timestamp,
              updatedAt: timestamp,
            }))
            set((state) => {
              const projects = existing
                ? state.projects.map((item) => (item.id === project.id ? project : item))
                : [project, ...state.projects]
              const next = {
                ...state,
                projects,
                labourRecords: [...records, ...state.labourRecords],
                weeklyPlans: [...weeklyPlans, ...state.weeklyPlans],
                weeklySnapshots: [...weeklySnapshots, ...state.weeklySnapshots],
                promptTemplates: [...promptTemplates, ...state.promptTemplates],
                lastImportError: undefined,
              }
              return {
                projects,
                labourRecords: next.labourRecords,
                weeklyPlans: next.weeklyPlans,
                weeklySnapshots: next.weeklySnapshots,
                promptTemplates: next.promptTemplates,
                badges: refreshBadges(next),
                lastImportError: undefined,
              }
            })
            return project
          } catch (error) {
            set({
              lastImportError:
                error instanceof Error ? error.message : '标记文档导入失败，请手动检查格式。',
            })
            return null
          }
        },
        exportProjectToMarkdown: (projectId) => {
          const state = get()
          const project = state.projects.find((item) => item.id === projectId)
          if (!project) return ''
          return exportProjectToMarkdown(
            project,
            state.labourRecords,
            state.weeklyPlans,
            state.weeklySnapshots,
            state.promptTemplates,
          )
        },
        computeUserStats: () => {
          const records = get().labourRecords
          return {
            currentStreak: getCurrentStreak(records),
            activeDays7: getActiveDaysInRange(records, 7),
            activeDays30: getActiveDaysInRange(records, 30),
            totalDurationMinutes: getTotalDuration(records),
          }
        },
        computeProjectStats: (projectId) => {
          const state = get()
          const project = state.projects.find((item) => item.id === projectId)
          const records = state.labourRecords.filter(
            (record) => record.projectId === projectId,
          )
          return {
            totalDurationMinutes: getTotalDuration(records),
            recordCount: records.length,
            recentProgress: project
              ? getProjectRecentProgress(project, records)
              : '项目不存在',
            thisWeekDurationMinutes: currentWeekDuration(records),
          }
        },
      }
    },
    {
      name: 'labourflow-domain-v1',
      version: 1,
    },
  ),
)
