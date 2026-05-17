import { describe, expect, it } from 'vitest'
import {
  getMarkdownListStyle,
  markdownListLines,
  markdownListItems,
  normalizeMarkdownListText,
} from '../../src/lib/markdown/listRendering'

describe('markdown list rendering helpers', () => {
  it('extracts list items from markdown text', () => {
    expect(markdownListItems('- First\n2. Second\n  * Third')).toEqual([
      'First',
      'Second',
      'Third',
    ])
  })

  it('detects ordered lists from the first non-empty line', () => {
    expect(getMarkdownListStyle('  \n1. First\n- Second')).toBe('ordered')
    expect(getMarkdownListStyle('- First\n2. Second')).toBe('unordered')
  })

  it('preserves nested markdown list markers for rendering', () => {
    expect(markdownListLines('- First\n  - Child\n  1. Step')).toEqual([
      { content: 'First', level: 0, marker: '-' },
      { content: 'Child', level: 1, marker: '-' },
      { content: 'Step', level: 1, marker: '1.' },
    ])
  })

  it('normalizes plain lines without flattening existing markdown indentation', () => {
    expect(normalizeMarkdownListText('First\n  - Child', 'unordered')).toBe(
      '- First\n  - Child'
    )
  })
})
