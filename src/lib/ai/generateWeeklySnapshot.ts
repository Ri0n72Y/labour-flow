import type { LabourRecord, Project, WeeklyPlan } from '../../types/domain'

export async function generateWeeklySnapshot({
  project,
  records,
  weeklyPlan,
  prompt,
}: {
  project: Project
  records: LabourRecord[]
  weeklyPlan?: WeeklyPlan
  prompt: string
}) {
  // Future serverless integration:
  // const response = await fetch('/api/generate-weekly-snapshot', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ project, records, weeklyPlan, prompt }),
  // })
  // const data = (await response.json()) as { content: string }
  // return data.content

  const totalMinutes = records.reduce(
    (total, record) => total + record.durationMinutes,
    0,
  )
  const progress = records
    .map((record) => `- ${record.date}: ${record.content}`)
    .join('\n')

  return Promise.resolve(`本周项目「${project.title}」共有 ${records.length} 条劳动记录，累计投入 ${totalMinutes} 分钟。

计划重点：
${weeklyPlan?.planText || '本周尚未维护计划。'}

实际推进：
${progress || '- 暂无记录'}

基于提示词的总结方向：
${prompt || '请总结持续劳动、实际推进和下周重点。'}`)
}
