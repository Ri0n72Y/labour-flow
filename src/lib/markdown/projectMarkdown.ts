import type {
  LabourRecord,
  Project,
  PromptTemplate,
  WeeklyPlan,
  WeeklySnapshot,
} from '../../types/domain'
import { getWeekRange } from '../date'

function linesFromList(items: string[] | undefined) {
  return items?.length ? items.map((item) => `- ${item}`).join('\n') : '- '
}

function projectPrompt(
  project: Project,
  promptTemplates: PromptTemplate[],
) {
  return (
    promptTemplates.find((prompt) => prompt.projectId === project.id)?.content ||
    promptTemplates.find((prompt) => prompt.scope === 'global')?.content ||
    ''
  )
}

export function exportProjectToMarkdown(
  project: Project,
  records: LabourRecord[],
  weeklyPlans: WeeklyPlan[],
  weeklySnapshots: WeeklySnapshot[],
  promptTemplates: PromptTemplate[],
) {
  const { weekStart, weekEnd } = getWeekRange()
  const projectRecords = records
    .filter((record) => record.projectId === project.id)
    .sort((left, right) => right.date.localeCompare(left.date))
  const currentWeekRecords = projectRecords.filter(
    (record) => record.date >= weekStart && record.date <= weekEnd,
  )
  const currentPlan = weeklyPlans.find(
    (plan) =>
      plan.projectId === project.id &&
      plan.weekStart === weekStart &&
      plan.weekEnd === weekEnd,
  )
  const currentSnapshot = weeklySnapshots.find(
    (snapshot) =>
      snapshot.projectId === project.id &&
      snapshot.weekStart === weekStart &&
      snapshot.weekEnd === weekEnd,
  )
  const historySnapshots = weeklySnapshots
    .filter(
      (snapshot) =>
        snapshot.projectId === project.id &&
        !(snapshot.weekStart === weekStart && snapshot.weekEnd === weekEnd),
    )
    .sort((left, right) => right.weekStart.localeCompare(left.weekStart))

  const recordLines = currentWeekRecords.length
    ? currentWeekRecords
        .map(
          (record) => `#### ${record.date}
- 做了什么：${record.content}
- 简短想法 / 变化：${record.reflection ?? ''}
- 用时：${record.durationMinutes} 分钟
- 推进说明：${record.progressNote ?? ''}`,
        )
        .join('\n\n')
    : `#### ${weekStart}
- 做了什么：
- 简短想法 / 变化：
- 用时：
- 推进说明：`

  const history = historySnapshots.length
    ? historySnapshots
        .map((snapshot) => {
          const plan = weeklyPlans.find(
            (item) =>
              item.projectId === project.id &&
              item.weekStart === snapshot.weekStart &&
              item.weekEnd === snapshot.weekEnd,
          )
          return `<details>
<summary>${snapshot.weekStart} ~ ${snapshot.weekEnd}</summary>

### 本周计划
${plan?.planText ?? ''}

### 工作日志
${projectRecords
  .filter(
    (record) => record.date >= snapshot.weekStart && record.date <= snapshot.weekEnd,
  )
  .map((record) => `- ${record.date}：${record.content}`)
  .join('\n')}

### 小结
${snapshot.content}

</details>`
        })
        .join('\n\n')
    : '<details>\n<summary>暂无历史周</summary>\n\n还没有历史周小结。\n\n</details>'

  return `# ${project.title}

> ${project.description ?? '一句话说明'}

---

## 本周（进行中）

### 本周计划

${currentPlan?.planText ?? '- '}

### 工作日志

${recordLines}

### 本周小结

> 提示词：
> ${currentSnapshot?.prompt || projectPrompt(project, promptTemplates)}

${currentSnapshot?.content ?? '智能生成或人工编辑的小结内容'}

---

## 历史周

${history}

---

## 项目方向（低频更新）

### 当前方向
${project.direction ?? ''}

### 当前假设
${project.hypothesis ?? ''}

### 当前完成标准
${project.completionCriteria ?? ''}

### 待办池
${linesFromList(project.backlog)}

---

## 背景 / 参考

- 
`
}

function section(markdown: string, heading: string) {
  const pattern = new RegExp(
    `### ${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n([\\s\\S]*?)(?=\\n### |\\n---|$)`,
  )
  return markdown.match(pattern)?.[1]?.trim()
}

export function parseProjectMarkdown(markdown: string): {
  project: Partial<Project>
  records: Partial<LabourRecord>[]
  weeklyPlans: Partial<WeeklyPlan>[]
  weeklySnapshots: Partial<WeeklySnapshot>[]
  promptTemplates: Partial<PromptTemplate>[]
} {
  const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim()
  const description = markdown.match(/^>\s+(.+)$/m)?.[1]?.trim()
  const backlogText =
    section(markdown, '待办池') ?? section(markdown, 'Backlog') ?? ''
  const backlog = backlogText
    .split('\n')
    .map((line) => line.replace(/^-\s*/, '').trim())
    .filter(Boolean)

  const records = Array.from(markdown.matchAll(/####\s+(\d{4}-\d{2}-\d{2})([\s\S]*?)(?=\n#### |\n### |$)/g)).map(
    (match) => {
      const block = match[2]
      const durationMatch = block.match(/用时：\s*(\d+)/)
      return {
        date: match[1],
        content: block.match(/做了什么：\s*(.*)/)?.[1]?.trim() ?? '',
        reflection:
          block.match(/简短想法 \/ 变化：\s*(.*)/)?.[1]?.trim() ?? undefined,
        durationMinutes: durationMatch ? Number(durationMatch[1]) : 0,
        progressNote:
          block.match(/推进说明：\s*(.*)/)?.[1]?.trim() ?? undefined,
      }
    },
  )

  const planText = section(markdown, '本周计划')
  const snapshotContent = section(markdown, '本周小结')
  const prompt = snapshotContent?.match(/>\s*提示词：\s*\n>\s*([\s\S]*?)(\n\n|$)/)?.[1]?.trim()

  return {
    project: {
      title,
      description,
      direction:
        section(markdown, '当前方向') ?? section(markdown, '当前方向（Direction）'),
      hypothesis:
        section(markdown, '当前假设') ?? section(markdown, '当前假设（Hypothesis）'),
      completionCriteria:
        section(markdown, '当前完成标准') ??
        section(markdown, '当前完成标准（Completion Criteria）'),
      backlog,
    },
    records,
    weeklyPlans: planText ? [{ planText }] : [],
    weeklySnapshots: snapshotContent
      ? [{ prompt: prompt ?? '', content: snapshotContent.replace(/^>.*$/gm, '').trim() }]
      : [],
    promptTemplates: prompt
      ? [{ name: '导入的周总结提示词', content: prompt, scope: 'project' }]
      : [],
  }
}
