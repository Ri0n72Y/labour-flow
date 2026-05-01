import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RecordModePill } from '../../src/components/record/RecordModePill'

describe('RecordModePill', () => {
  it('shows manual duration controls and switches modes', async () => {
    const user = userEvent.setup()
    const onModeChange = vi.fn()

    render(
      <RecordModePill
        mode="manual"
        status="idle"
        startAt={null}
        endAt={null}
        elapsedSeconds={0}
        manualDurationHours={1.5}
        hasTimerDraft={false}
        onModeChange={onModeChange}
        onManualDurationChange={vi.fn()}
        onStartTimer={vi.fn()}
        onPauseTimer={vi.fn()}
        onResumeTimer={vi.fn()}
        onStopTimer={vi.fn()}
        onResetDraft={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('手动输入用时')).toHaveValue(1.5)
    expect(screen.queryByLabelText('重置记录')).not.toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /实时计时/ }))
    expect(onModeChange).toHaveBeenCalledWith('timer')
  })

  it('hides the mode switch when the timer is active and shows reset controls', () => {
    render(
      <RecordModePill
        mode="timer"
        status="running"
        startAt="2026-04-30T00:00:00.000Z"
        endAt={null}
        elapsedSeconds={3661}
        manualDurationHours={1}
        hasTimerDraft={true}
        onModeChange={vi.fn()}
        onManualDurationChange={vi.fn()}
        onStartTimer={vi.fn()}
        onPauseTimer={vi.fn()}
        onResumeTimer={vi.fn()}
        onStopTimer={vi.fn()}
        onResetDraft={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('暂停计时')).toBeInTheDocument()
    expect(screen.getByLabelText('重置记录')).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  })
})
