export interface UserProfile {
  id: string
  displayName: string
  bio?: string
  publicKey?: string
  mainDirection?: string
  createdAt: string
}

export interface Project {
  id: string
  title: string
  description?: string
  direction?: string
  hypothesis?: string
  completionCriteria?: string
  backlog?: string[]
  backlogText?: string
  createdAt: string
  updatedAt: string
  isArchived?: boolean
}

export interface LabourRecord {
  id: string
  projectId: string
  date: string
  content: string
  durationMinutes: number
  createdAt: string
  updatedAt: string
}

export interface WeeklyPlan {
  id: string
  projectId: string
  weekStart: string
  weekEnd: string
  planText: string
  createdAt: string
  updatedAt: string
}

export interface WeeklySnapshot {
  id: string
  projectId: string
  weekStart: string
  weekEnd: string
  prompt: string
  content: string
  generatedAt?: string
  editedAt?: string
}

export interface PromptTemplate {
  id: string
  name: string
  content: string
  scope: 'global' | 'project'
  projectId?: string
  createdAt: string
  updatedAt: string
}

export interface Badge {
  id: string
  name: string
  description: string
  type: 'consistency' | 'progress' | 'summary' | 'collaboration'
  earnedAt: string
}

export interface UserStats {
  currentStreak: number
  activeDays7: number
  activeDays30: number
  totalDurationMinutes: number
}

export interface ProjectStats {
  totalDurationMinutes: number
  recordCount: number
  recentProgress: string
  thisWeekDurationMinutes: number
}
