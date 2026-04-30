import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'

const root = process.cwd()
const server = await createServer({
  root,
  configFile: false,
  logLevel: 'error',
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true },
})

try {
  const {
    exportProjectToMarkdown,
    parseProjectMarkdown,
    projectMarkdownTemplate,
  } = await server.ssrLoadModule('/src/lib/markdown/projectMarkdown.ts')
  const example = await readFile('docs/example.md', 'utf8')
  const parsed = parseProjectMarkdown(example)
  const timestamp = '2026-04-30T00:00:00.000Z'
  const projectId = 'project-example'
  const project = {
    id: projectId,
    title: parsed.project.title || '导入的项目',
    description: parsed.project.description,
    direction: parsed.project.direction,
    hypothesis: parsed.project.hypothesis,
    completionCriteria: parsed.project.completionCriteria,
    backlog: parsed.project.backlog,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  const records = parsed.records.map((record, index) => ({
    id: `record-${index}`,
    projectId,
    date: record.date || '2026-04-30',
    content: record.content || '',
    durationMinutes: record.durationMinutes || 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  }))
  const weeklyPlans = parsed.weeklyPlans.map((plan, index) => ({
    id: `plan-${index}`,
    projectId,
    weekStart: plan.weekStart,
    weekEnd: plan.weekEnd,
    planText: plan.planText || '',
    createdAt: timestamp,
    updatedAt: timestamp,
  }))
  const weeklySnapshots = parsed.weeklySnapshots.map((snapshot, index) => ({
    id: `snapshot-${index}`,
    projectId,
    weekStart: snapshot.weekStart,
    weekEnd: snapshot.weekEnd,
    prompt: snapshot.prompt || '',
    content: snapshot.content || '',
    editedAt: timestamp,
  }))

  const generated = exportProjectToMarkdown(
    project,
    records,
    weeklyPlans,
    weeklySnapshots,
    parsed.promptTemplates,
    { currentDate: '2026-04-30', includeEmptyCurrentWeek: false },
  )

  assert.ok(projectMarkdownTemplate.includes('## 记录（持续更新）'))
  assert.ok(generated.includes('## 项目方向（低频更新）'))
  assert.ok(generated.includes('### 第三周'))
  assert.ok(generated.includes('##### 2026-03-17'))
  assert.ok(generated.includes('完成能够实时总结的Agent客户端，部署上线并测试'))
  assert.equal(records.length, 11)
  assert.equal(weeklyPlans.length, 3)
  assert.equal(weeklySnapshots.length, 2)

  const normalizeLine = (line) => line.trim().replace(/\s+/g, ' ')
  const sourceLines = new Set(
    example
      .split('\n')
      .map(normalizeLine)
      .filter((line) => line && line !== '---'),
  )
  const generatedLines = new Set(
    generated
      .split('\n')
      .map(normalizeLine)
      .filter((line) => line && line !== '---'),
  )
  const overlap = [...sourceLines].filter((line) => generatedLines.has(line)).length
  const similarity = overlap / sourceLines.size

  assert.ok(
    similarity >= 0.65,
    `Expected generated markdown to stay close to docs/example.md, got ${similarity.toFixed(2)}`,
  )

  console.log(
    `project markdown fixture: ${records.length} records, ${weeklyPlans.length} plans, ${weeklySnapshots.length} summaries, similarity ${similarity.toFixed(2)}`,
  )
} finally {
  await server.close()
}
