import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RecordPage } from '../../src/pages/RecordPage'
import { resetStores } from '../test-utils'

describe('RecordPage', () => {
  it('gates the record flow until the user has generated keys', () => {
    resetStores()

    render(<RecordPage />)

    expect(screen.getByRole('button', { name: /注册并生成密钥/ })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /完成并签名/ }),
    ).not.toBeInTheDocument()
  })
})
