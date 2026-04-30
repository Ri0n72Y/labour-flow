import { describe, expect, it } from 'vitest'
import {
  getMarkdownListStyle,
  markdownListItems,
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
})
