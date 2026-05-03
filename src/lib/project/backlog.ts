export interface BacklogTask {
  checked: boolean
  lineIndex: number
  text: string
}

export interface BacklogTextLine {
  lineIndex: number
  text: string
}

export interface BacklogSection {
  id: string
  title?: string
  tasks: BacklogTask[]
  lines: BacklogTextLine[]
}

export function backlogItemsFromText(value: string) {
  return value
    .split('\n')
    .map((line) =>
      line
        .trim()
        .replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)/, '')
        .replace(/^\[[ xX]\]\s+/, '')
        .trim()
    )
    .filter((line) => line && !line.startsWith('#'))
}

export function linesFromBacklog(items: string[] | undefined) {
  return items?.map((item) => `- ${item}`).join('\n') ?? ''
}

export function updateBacklogTaskLine(
  markdown: string,
  lineIndex: number,
  checked: boolean
) {
  const lines = markdown.split('\n')
  const line = lines[lineIndex]
  if (line === undefined) return markdown

  const marker = checked ? 'x' : ' '
  if (/^\s*(?:[-*+]|\d+[.)])\s+\[[ xX]\]\s+/.test(line)) {
    lines[lineIndex] = line.replace(/\[[ xX]\]/, `[${marker}]`)
  } else {
    lines[lineIndex] = line.replace(
      /^(\s*(?:[-*+]|\d+[.)])\s+)/,
      `$1[${marker}] `
    )
  }

  return lines.join('\n')
}

export function parseBacklog(markdown: string, fallbackItems: string[]) {
  const sections: BacklogSection[] = []
  let current: BacklogSection = {
    id: 'default',
    tasks: [],
    lines: [],
  }

  const pushCurrent = () => {
    if (current.title || current.tasks.length || current.lines.length) {
      sections.push(current)
    }
  }

  if (markdown.trim()) {
    markdown.split('\n').forEach((line, lineIndex) => {
      const parsed = parseBacklogLine(line, lineIndex)
      if (!parsed) return

      if (parsed.type === 'heading') {
        pushCurrent()
        current = {
          id: `section-${lineIndex}`,
          title: parsed.title,
          tasks: [],
          lines: [],
        }
        return
      }

      if (parsed.type === 'task') {
        current.tasks.push(parsed.task)
        return
      }

      current.lines.push(parsed.line)
    })
    pushCurrent()
  }

  if (sections.length || !fallbackItems.length) return sections

  return [
    {
      id: 'fallback',
      tasks: fallbackItems.map((text, index) => ({
        checked: false,
        lineIndex: index,
        text,
      })),
      lines: [],
    },
  ]
}

function parseBacklogLine(line: string, lineIndex: number) {
  const heading = line.match(/^####\s+(.+?)\s*$/)
  if (heading) {
    return { type: 'heading' as const, title: heading[1].trim() }
  }

  const task = line.match(/^\s*(?:[-*+]|\d+[.)])\s+\[([ xX])\]\s+(.+?)\s*$/)
  if (task) {
    return {
      type: 'task' as const,
      task: {
        checked: task[1].toLowerCase() === 'x',
        lineIndex,
        text: task[2].trim(),
      },
    }
  }

  const listItem = line.match(/^\s*(?:[-*+]|\d+[.)])\s+(.+?)\s*$/)
  if (listItem) {
    return {
      type: 'task' as const,
      task: {
        checked: false,
        lineIndex,
        text: listItem[1].trim(),
      },
    }
  }

  const text = line.trim()
  return text ? { type: 'line' as const, line: { lineIndex, text } } : undefined
}
