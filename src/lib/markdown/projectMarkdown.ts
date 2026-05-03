import type {
  LabourRecord,
  Project,
  PromptTemplate,
  WeeklyPlan,
  WeeklySnapshot,
} from '../../types/domain'
import { getWeekRange } from '../date'
/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
// @ts-ignore Vite resolves this raw import at build time.
import projectMarkdownTemplateSource from './template.md?raw'

interface ExportProjectMarkdownOptions {
  currentDate?: Date | string
  includeEmptyCurrentWeek?: boolean
}

interface WeekDocument {
  weekStart: string
  weekEnd: string
  records: LabourRecord[]
  plan?: WeeklyPlan
  snapshot?: WeeklySnapshot
}

const weekNumberLabels = [
  '零',
  '一',
  '二',
  '三',
  '四',
  '五',
  '六',
  '七',
  '八',
  '九',
  '十',
]

export const projectMarkdownTemplate = normalizeMarkdown(
  projectMarkdownTemplateSource
)

function normalizeMarkdown(markdown: string) {
  return markdown.replace(/\r\n/g, '\n').trim()
}

function linesFromList(items: string[] | undefined) {
  return items?.length ? items.map((item) => `- ${item}`).join('\n') : ''
}

function projectPrompt(project: Project, promptTemplates: PromptTemplate[]) {
  return (
    promptTemplates.find((prompt) => prompt.projectId === project.id)
      ?.content ||
    promptTemplates.find((prompt) => prompt.scope === 'global')?.content ||
    ''
  )
}

function weekLabel(index: number) {
  if (index < weekNumberLabels.length) return `第${weekNumberLabels[index]}周`
  return `第${index}周`
}

function durationLine(minutes: number) {
  if (!minutes) return ''
  const hours = minutes / 60
  return Number.isInteger(hours) ? `- ~${hours}h` : `- ~${hours.toFixed(1)}h`
}

function cleanBlock(value: string | undefined, fallback = '') {
  return value?.trim() || fallback
}

function formatRecord(record: LabourRecord) {
  const content = cleanBlock(record.content, '- ')
  const body = content
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
  return [`##### ${record.date}`, body, durationLine(record.durationMinutes)]
    .filter(Boolean)
    .join('\n')
}

function formatSnapshot(snapshot: WeeklySnapshot | undefined, prompt: string) {
  if (!snapshot?.content.trim()) return ''
  const promptLines = snapshot.prompt || prompt
  if (!promptLines) return snapshot.content.trim()
  return [
    `> 提示词：${promptLines
      .split('\n')
      .map((line, index) => (index === 0 ? line : `> ${line}`))
      .join('\n')}`,
    '',
    snapshot.content.trim(),
  ].join('\n')
}

function createWeekDocuments(
  project: Project,
  records: LabourRecord[],
  weeklyPlans: WeeklyPlan[],
  weeklySnapshots: WeeklySnapshot[],
  options: ExportProjectMarkdownOptions
) {
  const { weekStart: currentWeekStart, weekEnd: currentWeekEnd } = getWeekRange(
    options.currentDate
  )
  const weekMap = new Map<string, WeekDocument>()

  const ensureWeek = (weekStart: string, weekEnd: string) => {
    const key = `${weekStart}:${weekEnd}`
    const existing = weekMap.get(key)
    if (existing) return existing
    const week: WeekDocument = { weekStart, weekEnd, records: [] }
    weekMap.set(key, week)
    return week
  }

  for (const record of records.filter(
    (record) => record.projectId === project.id
  )) {
    const { weekStart, weekEnd } = getWeekRange(record.date)
    ensureWeek(weekStart, weekEnd).records.push(record)
  }

  for (const plan of weeklyPlans.filter(
    (plan) => plan.projectId === project.id
  )) {
    ensureWeek(plan.weekStart, plan.weekEnd).plan = plan
  }

  for (const snapshot of weeklySnapshots.filter(
    (snapshot) => snapshot.projectId === project.id
  )) {
    ensureWeek(snapshot.weekStart, snapshot.weekEnd).snapshot = snapshot
  }

  if (options.includeEmptyCurrentWeek !== false) {
    ensureWeek(currentWeekStart, currentWeekEnd)
  }

  return Array.from(weekMap.values())
    .map((week) => ({
      ...week,
      records: week.records.sort((left, right) =>
        left.date.localeCompare(right.date)
      ),
    }))
    .sort((left, right) => right.weekStart.localeCompare(left.weekStart))
}

function renderWeek(week: WeekDocument, label: string, prompt: string) {
  const sections = [
    optionalMarkdownSection(
      '#### 本周目标（可随时修改）',
      week.plan?.planText
    ),
    optionalMarkdownSection(
      '#### 工作日志（随手记录，不需要结构）',
      week.records.map(formatRecord).filter(Boolean).join('\n\n')
    ),
    optionalMarkdownSection(
      '#### 小结（由日志自动生成）',
      formatSnapshot(week.snapshot, prompt)
    ),
  ].filter(Boolean)

  if (!sections.length) return ''

  return [`### ${label}`, ...sections].join('\n\n---\n\n')
}

function optionalMarkdownSection(heading: string, body: string | undefined) {
  const cleaned = cleanBlock(body)
  return cleaned ? `${heading}\n${cleaned}` : ''
}

function renderProjectDirection(project: Project) {
  const backlog = project.backlogText?.trim() || linesFromList(project.backlog)
  const sections = [
    optionalMarkdownSection('### 当前方向', project.direction),
    optionalMarkdownSection('### 当前假设', project.hypothesis),
    optionalMarkdownSection('### 当前完成标准', project.completionCriteria),
    optionalMarkdownSection('### Backlog（可选）', backlog),
  ].filter(Boolean)

  if (!sections.length) return ''

  return ['## 项目方向（低频更新）', ...sections].join('\n\n')
}

export function exportProjectToMarkdown(
  project: Project,
  records: LabourRecord[],
  weeklyPlans: WeeklyPlan[],
  weeklySnapshots: WeeklySnapshot[],
  promptTemplates: PromptTemplate[],
  options: ExportProjectMarkdownOptions = {}
) {
  const weeks = createWeekDocuments(
    project,
    records,
    weeklyPlans,
    weeklySnapshots,
    options
  )
  const chronological = [...weeks].sort((left, right) =>
    left.weekStart.localeCompare(right.weekStart)
  )
  const labels = new Map(
    chronological.map((week, index) => [
      `${week.weekStart}:${week.weekEnd}`,
      weekLabel(index + 1),
    ])
  )
  const prompt = projectPrompt(project, promptTemplates)
  const renderedWeeks = weeks
    .map((week) =>
      renderWeek(
        week,
        labels.get(`${week.weekStart}:${week.weekEnd}`) ?? '第X周',
        prompt
      )
    )
    .filter(Boolean)
    .join('\n\n')
  const projectDirection = renderProjectDirection(project)

  return [renderedWeeks, projectDirection].filter(Boolean).join('\n\n')
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function headingSection(markdown: string, level: number, heading: string) {
  const hashes = '#'.repeat(level)
  const pattern = new RegExp(
    `^${hashes}\\s+${escapeRegExp(heading)}\\s*$`,
    'm'
  )
  const match = markdown.match(pattern)
  if (!match || match.index === undefined) return undefined
  const bodyStart = match.index + match[0].length
  const rest = markdown.slice(bodyStart)
  const nextSameOrHigher = new RegExp(`\\n#{1,${level}}\\s+`, 'm')
  const endMatch = rest.match(nextSameOrHigher)
  const body = endMatch?.index === undefined ? rest : rest.slice(0, endMatch.index)
  return body.trim()
}

function subsection(markdown: string, heading: string) {
  const pattern = new RegExp(
    `^####\\s+${escapeRegExp(heading)}\\s*$`,
    'm'
  )
  const match = markdown.match(pattern)
  if (!match || match.index === undefined) return undefined
  const bodyStart = match.index + match[0].length
  const rest = markdown.slice(bodyStart)
  const endMatch = rest.match(/\n(?:---\s*\n|#{1,4}\s+)/m)
  const body = endMatch?.index === undefined ? rest : rest.slice(0, endMatch.index)
  return body.trim()
}

function headingBlocks(
  markdown: string,
  level: number,
  matchesHeading: (heading: string) => boolean
) {
  const headingPattern = new RegExp(`^#{${level}}\\s+(.+?)\\s*$`, 'gm')
  const headings = Array.from(markdown.matchAll(headingPattern))
    .map((match) => ({
      heading: match[1].trim(),
      index: match.index ?? 0,
      length: match[0].length,
    }))
    .filter((match) => matchesHeading(match.heading))

  return headings.map((heading) => {
    const bodyStart = heading.index + heading.length
    const rest = markdown.slice(bodyStart)
    const endMatch = rest.match(new RegExp(`\\n#{1,${level}}\\s+`, 'm'))
    const body =
      endMatch?.index === undefined ? rest : rest.slice(0, endMatch.index)
    return {
      heading: heading.heading,
      body: body.trim(),
    }
  })
}

function parseDurationMinutes(block: string) {
  const hourMatch = block.match(/~\s*(\d+(?:\.\d+)?)\s*h/i)
  if (hourMatch) return Math.round(Number(hourMatch[1]) * 60)
  const minuteMatch = block.match(/(?:用时|耗时)[：:]\s*(\d+)/)
  return minuteMatch ? Number(minuteMatch[1]) : 0
}

function stripDurationLines(block: string) {
  return block
    .split('\n')
    .filter((line) => !/^\s*[-*]?\s*~\s*\d+(?:\.\d+)?\s*h\s*$/i.test(line))
    .join('\n')
    .trim()
}

function stripMarkdownListMarker(line: string) {
  return line
    .replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)/, '')
    .replace(/^\[[ xX]\]\s+/, '')
    .trim()
}

function backlogItemsFromMarkdown(block: string) {
  return block
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^[-*+]\s+|\d+[.)]\s+/.test(line))
    .map(stripMarkdownListMarker)
    .filter((line) => line && !line.startsWith('（'))
}

function parseRecords(block: string | undefined) {
  if (!block) return []
  return Array.from(
    block.matchAll(
      /^#####\s+(\d{4}-\d{2}-\d{2})\n([\s\S]*?)(?=\n##### |\n---\n|(?![\s\S]))/gm
    )
  ).map((match) => ({
    date: match[1],
    content: stripDurationLines(match[2]),
    durationMinutes: parseDurationMinutes(match[2]),
  }))
}

function parseSnapshot(block: string | undefined) {
  if (!block) return undefined
  const promptMatch = block.match(
    /^>\s*提示词[：:]\s*([\s\S]*?)(?=\n(?!>)|\n\n(?!>)|(?![\s\S]))/m
  )
  const prompt = promptMatch?.[1]
    ?.split('\n')
    .map((line) => line.replace(/^>\s?/, '').trimEnd())
    .join('\n')
    .trim()
  const content = block.replace(/^>.*$/gm, '').trim()
  return { prompt: prompt ?? '', content }
}

function inferWeekRange(
  parsedRecords: Partial<LabourRecord>[],
  fallbackIndex: number
) {
  const firstDate = parsedRecords.find((record) => record.date)?.date
  if (firstDate) return getWeekRange(firstDate)
  const fallbackDate = new Date()
  fallbackDate.setDate(fallbackDate.getDate() - fallbackIndex * 7)
  return getWeekRange(fallbackDate)
}

export function parseProjectMarkdown(markdown: string): {
  project: Partial<Project>
  records: Partial<LabourRecord>[]
  weeklyPlans: Partial<WeeklyPlan>[]
  weeklySnapshots: Partial<WeeklySnapshot>[]
  promptTemplates: Partial<PromptTemplate>[]
} {
  const normalized = normalizeMarkdown(markdown)
  const title = normalized.match(/^#\s+(.+)$/m)?.[1]?.trim()
  const description = normalized.match(/^>\s+(.+)$/m)?.[1]?.trim()
  const direction = headingSection(normalized, 3, '当前方向')
  const hypothesis = headingSection(normalized, 3, '当前假设')
  const completionCriteria = headingSection(normalized, 3, '当前完成标准')
  const backlogText = cleanBlock(
    headingSection(normalized, 3, 'Backlog（可选）') ??
    headingSection(normalized, 3, 'Backlog') ??
    headingSection(normalized, 3, '待办池') ??
    ''
  )
  const backlog = backlogItemsFromMarkdown(backlogText)

  const weekBlocks = headingBlocks(
    normalized,
    3,
    (heading) => /^第.+?周$/.test(heading) || /^本周(?:（.*?）)?$/.test(heading)
  )
  const records: Partial<LabourRecord>[] = []
  const weeklyPlans: Partial<WeeklyPlan>[] = []
  const weeklySnapshots: Partial<WeeklySnapshot>[] = []
  const promptTemplates: Partial<PromptTemplate>[] = []

  weekBlocks.forEach((week, index) => {
    const weekBlock = week.body
    const weekRecords = parseRecords(
      subsection(weekBlock, '工作日志（随手记录，不需要结构）')
    )
    const { weekStart, weekEnd } = inferWeekRange(weekRecords, index)
    records.push(...weekRecords)

    const planText = subsection(weekBlock, '本周目标（可随时修改）')
    if (planText && !planText.startsWith('（')) {
      weeklyPlans.push({ weekStart, weekEnd, planText })
    }

    const snapshot = parseSnapshot(
      subsection(weekBlock, '小结（由日志自动生成）')
    )
    if (snapshot && snapshot.content && !snapshot.content.startsWith('（')) {
      weeklySnapshots.push({
        weekStart,
        weekEnd,
        prompt: snapshot.prompt,
        content: snapshot.content,
      })
      if (snapshot.prompt) {
        promptTemplates.push({
          name: '导入的周总结提示词',
          content: snapshot.prompt,
          scope: 'project',
        })
      }
    }
  })

  return {
    project: {
      title,
      description,
      direction,
      hypothesis,
      completionCriteria,
      backlog,
      backlogText,
    },
    records,
    weeklyPlans,
    weeklySnapshots,
    promptTemplates,
  }
}
