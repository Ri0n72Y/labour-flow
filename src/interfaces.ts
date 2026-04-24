export interface LaborData {
  wid: string
  startAt: string // UTC
  endAt: string // UTC
  duration: number // in seconds

  createBy: string // public key
  createAt: string // UTC

  outcome: string
  description: string
  tags: string[]

  signature: string
}

export interface RuntimeInfo extends LaborData {
  cover: string // cover image
}

export type RecordMode = 'timer' | 'manual'
export type RecordStatus = 'idle' | 'running' | 'paused' | 'stopped'
export type ViewPeriod = 'day' | 'week' | 'month'

export interface LaborLogEntry {
  id: string
  text: string
  done: boolean
  createdAt: string
}

export interface UserProfile {
  uid: string
  avatarDataUrl: string
  publicKeyJwk: JsonWebKey | null
  privateKeyJwk: JsonWebKey | null
  createdAt: string | null
}

export interface LaborDraft {
  mode: RecordMode
  status: RecordStatus
  startAt: string | null
  endAt: string | null
  pausedAt: string | null
  pausedSeconds: number
  manualDurationHours: number
  logs: LaborLogEntry[]
  activeText: string
  tags: string[]
}

export interface SignedLaborRecord extends LaborData {
  logEntries: LaborLogEntry[]
}
