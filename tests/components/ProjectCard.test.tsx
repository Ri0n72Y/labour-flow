import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProjectCard } from '../../src/components/project/ProjectCard'
import type { Project, ProjectStats } from '../../src/types/domain'

const project: Project = {
  id: 'project-1',
  title: 'Alpha',
  description: 'Project description',
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
}

const stats: ProjectStats = {
  totalDurationMinutes: 90,
  recordCount: 3,
  recentProgress: 'Progress summary',
  thisWeekDurationMinutes: 45,
}

describe('ProjectCard', () => {
  it('renders the project summary and opens the detail view', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()

    render(<ProjectCard project={project} stats={stats} onOpen={onOpen} />)

    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Progress summary')).toBeInTheDocument()
    expect(screen.getByText('3 条记录')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /查看详情/ }))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('marks archived projects', () => {
    render(
      <ProjectCard
        project={{ ...project, isArchived: true }}
        stats={stats}
      />,
    )

    expect(screen.getByText('已归档')).toBeInTheDocument()
  })
})
