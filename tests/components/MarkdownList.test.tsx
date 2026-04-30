import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MarkdownList } from '../../src/components/MarkdownList'

describe('MarkdownList', () => {
  it('renders empty state when there are no items', () => {
    render(<MarkdownList text="" />)

    expect(screen.getByText('暂无内容')).toBeInTheDocument()
  })

  it('renders unordered items by default', () => {
    render(<MarkdownList text="- First\n- Second" />)

    const list = screen.getByRole('list')
    expect(list).toHaveClass('list-disc')
    expect(list).toHaveTextContent('First')
    expect(list).toHaveTextContent('Second')
  })

  it('renders ordered items when the first line is numbered', () => {
    render(<MarkdownList text="1. First\n2. Second" />)

    expect(screen.getByRole('list')).toHaveClass('list-decimal')
  })
})
