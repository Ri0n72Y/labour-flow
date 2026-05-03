import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BacklogPreview } from '../../src/components/project/BacklogPreview'

describe('BacklogPreview', () => {
  it('renders markdown sections and toggles tasks by source line index', async () => {
    const user = userEvent.setup()
    const onToggleTask = vi.fn()

    render(
      <BacklogPreview
        markdown={[
          '#### Protocol',
          'Keep this focused.',
          '- [ ] define schema',
          '- [x] write tests',
        ].join('\n')}
        onToggleTask={onToggleTask}
      />,
    )

    expect(screen.getByRole('button', { name: /Protocol/ })).toBeInTheDocument()
    expect(screen.getByText('Keep this focused.')).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: /define schema/ }))
    expect(onToggleTask).toHaveBeenCalledWith(2, true)
  })

  it('renders fallback items as read-only tasks', () => {
    render(<BacklogPreview fallbackItems={['legacy task']} readOnly />)

    expect(screen.getByRole('checkbox', { name: /legacy task/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })
})
