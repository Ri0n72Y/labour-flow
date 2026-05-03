import { describe, expect, it } from 'vitest'
import type { LaborDraft } from '../../src/interfaces'
import {
  activeProjects,
  canSignDraft,
  fallbackProjectId,
  labourRecordInputFromPrepared,
  prepareLaborRecord,
  resolveSelectedProjectId,
  sanitizeTagInput,
} from '../../src/lib/recording/recordSubmission'
import type { LabourRecord, Project } from '../../src/types/domain'

describe('record submission helpers', () => {
  it('resolves active and fallback projects from recent labour records', () => {
    const projects: Project[] = [
      project('archived', true),
      project('project-a'),
      project('project-b'),
    ]
    const records: LabourRecord[] = [
      record('record-b', 'project-b', '2026-05-02'),
      record('record-archived', 'archived', '2026-05-03'),
    ]
    const availableProjects = activeProjects(projects)

    expect(availableProjects.map((item) => item.id)).toEqual([
      'project-a',
      'project-b',
    ])
    expect(fallbackProjectId(records, availableProjects)).toBe('project-b')
    expect(
      resolveSelectedProjectId(availableProjects, 'missing', 'project-b'),
    ).toBe('project-b')
    expect(
      resolveSelectedProjectId(availableProjects, 'project-a', 'project-b'),
    ).toBe('project-a')
  })

  it('keeps signing disabled until keys and a signable draft exist', () => {
    expect(canSignDraft({ ...draft(), hasKeys: false })).toBe(false)
    expect(canSignDraft({ ...draft(), hasKeys: true })).toBe(false)
    expect(
      canSignDraft({
        ...draft({ activeText: 'Ship parser' }),
        hasKeys: true,
      }),
    ).toBe(true)
    expect(
      canSignDraft({
        ...draft({
          activeText: 'Ship parser',
          mode: 'timer',
          status: 'running',
        }),
        hasKeys: true,
      }),
    ).toBe(false)
  })

  it('prepares manual labour record payloads for signing', () => {
    const prepared = prepareLaborRecord({
      createAt: '2026-05-03T10:00:00.000Z',
      createBy: 'public-key',
      draft: draft({
        logs: [log('define schema'), log('write tests')],
        manualDurationHours: 1.5,
        tags: ['protocol'],
      }),
      listStyle: 'ordered',
      manualDateValue: '2026-05-03',
      wid: 'wid-1',
    })

    expect(prepared).toMatchObject({
      ok: true,
      description: '1. define schema\n2. write tests',
      duration: 5400,
    })
    if (!prepared.ok) return
    expect(prepared.recordBase).toMatchObject({
      wid: 'wid-1',
      createBy: 'public-key',
      outcome: '',
      tags: ['protocol'],
    })
    expect(
      Date.parse(prepared.recordBase.endAt) -
        Date.parse(prepared.recordBase.startAt),
    ).toBe(90 * 60 * 1000)
    expect(
      labourRecordInputFromPrepared({
        projectId: 'project-a',
        date: '2026-05-03',
        description: prepared.description,
        duration: prepared.duration,
      }),
    ).toEqual({
      projectId: 'project-a',
      date: '2026-05-03',
      content: '1. define schema\n2. write tests',
      durationMinutes: 90,
    })
  })

  it('prepares stopped timer payloads and subtracts paused time', () => {
    const prepared = prepareLaborRecord({
      createAt: '2026-05-03T10:00:00.000Z',
      createBy: 'public-key',
      draft: draft({
        mode: 'timer',
        status: 'stopped',
        startAt: '2026-05-03T00:00:00.000Z',
        endAt: '2026-05-03T01:00:00.000Z',
        pausedSeconds: 300,
        logs: [log('ship timer')],
      }),
      listStyle: 'unordered',
      manualDateValue: '2026-05-03',
      wid: 'wid-2',
    })

    expect(prepared).toMatchObject({
      ok: true,
      description: '- ship timer',
      duration: 3300,
    })
  })

  it('normalizes tag entry before toggling it into the draft', () => {
    expect(sanitizeTagInput('  #labour  ')).toBe('labour')
    expect(sanitizeTagInput('   ')).toBe('')
  })
})

function project(id: string, isArchived = false): Project {
  return {
    id,
    title: id,
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    isArchived,
  }
}

function record(id: string, projectId: string, date: string): LabourRecord {
  return {
    id,
    projectId,
    date,
    content: id,
    durationMinutes: 30,
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
  }
}

function log(text: string) {
  return {
    id: text,
    text,
    done: true,
    createdAt: '2026-05-03T00:00:00.000Z',
  }
}

function draft(overrides: Partial<LaborDraft> = {}): LaborDraft {
  return {
    mode: 'manual',
    status: 'idle',
    startAt: null,
    endAt: null,
    pausedAt: null,
    pausedSeconds: 0,
    manualDurationHours: 1,
    logs: [],
    activeText: '',
    tags: [],
    ...overrides,
  }
}
