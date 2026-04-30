import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RegistrationGate } from '../../src/components/record/RegistrationGate'

describe('RegistrationGate', () => {
  it('disables registration while running and shows the status message', async () => {
    const user = userEvent.setup()
    const onRegister = vi.fn()

    render(
      <RegistrationGate
        registering={true}
        message="请先完成初始化"
        onRegister={onRegister}
      />,
    )

    expect(screen.getByText('请先完成初始化')).toBeInTheDocument()
    const button = screen.getByRole('button', { name: /注册中/ })
    expect(button).toBeDisabled()

    await user.click(button)
    expect(onRegister).not.toHaveBeenCalled()
  })
})
