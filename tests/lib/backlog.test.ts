import { describe, expect, it } from 'vitest'
import {
  backlogItemsFromText,
  linesFromBacklog,
  parseBacklog,
  updateBacklogTaskLine,
} from '../../src/lib/project/backlog'

describe('backlog helpers', () => {
  it('parses headed markdown sections into text lines and tasks', () => {
    const sections = parseBacklog(
      [
        '#### Protocol',
        'Keep this section focused.',
        '- [ ] define schema',
        '1. [x] write tests',
      ].join('\n'),
      [],
    )

    expect(sections).toEqual([
      {
        id: 'section-0',
        title: 'Protocol',
        lines: [{ lineIndex: 1, text: 'Keep this section focused.' }],
        tasks: [
          { checked: false, lineIndex: 2, text: 'define schema' },
          { checked: true, lineIndex: 3, text: 'write tests' },
        ],
      },
    ])
  })

  it('falls back to legacy backlog items when markdown is empty', () => {
    expect(parseBacklog('', ['first', 'second'])).toEqual([
      {
        id: 'fallback',
        lines: [],
        tasks: [
          { checked: false, lineIndex: 0, text: 'first' },
          { checked: false, lineIndex: 1, text: 'second' },
        ],
      },
    ])
  })

  it('normalizes markdown text into stored backlog item labels', () => {
    expect(
      backlogItemsFromText(
        ['#### Protocol', '- [ ] define schema', '2. [x] write tests'].join(
          '\n',
        ),
      ),
    ).toEqual(['define schema', 'write tests'])
  })

  it('toggles existing tasks and upgrades list items into tasks', () => {
    const markdown = ['- [ ] define schema', '- write tests'].join('\n')

    expect(updateBacklogTaskLine(markdown, 0, true)).toBe(
      ['- [x] define schema', '- write tests'].join('\n'),
    )
    expect(updateBacklogTaskLine(markdown, 1, true)).toBe(
      ['- [ ] define schema', '- [x] write tests'].join('\n'),
    )
    expect(updateBacklogTaskLine(markdown, 9, true)).toBe(markdown)
  })

  it('renders legacy items as markdown list lines', () => {
    expect(linesFromBacklog(['first', 'second'])).toBe('- first\n- second')
  })
})
