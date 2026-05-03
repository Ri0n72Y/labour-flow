import { useTranslation } from 'react-i18next'
import type { ReactElement } from 'react'
import { cn } from '../lib/styles/cn'

interface ParagraphNode {
  id: string
  kind: 'paragraph'
  text: string
}

interface ListNode {
  children: MarkdownNode[]
  id: string
  indent: number
  kind: 'listItem'
  ordered: boolean
  text: string
}

type MarkdownNode = ParagraphNode | ListNode

const listLinePattern = /^(\s*)(?:([-*+])|(\d+)[.)])\s+(.+?)\s*$/

function indentWidth(value: string) {
  return value.replace(/\t/g, '  ').length
}

function cleanTaskMarker(value: string) {
  return value.replace(/^\[[ xX]\]\s+/, '')
}

function parseMarkdownBlock(text: string) {
  const roots: MarkdownNode[] = []
  const stack: ListNode[] = []

  text.split('\n').forEach((line, index) => {
    if (!line.trim()) return

    const listMatch = line.match(listLinePattern)
    if (!listMatch) {
      stack.length = 0
      roots.push({
        id: `p-${index}`,
        kind: 'paragraph',
        text: line.trim(),
      })
      return
    }

    const node: ListNode = {
      children: [],
      id: `li-${index}`,
      indent: indentWidth(listMatch[1]),
      kind: 'listItem',
      ordered: Boolean(listMatch[3]),
      text: cleanTaskMarker(listMatch[4].trim()),
    }

    while (stack.length && stack[stack.length - 1].indent >= node.indent) {
      stack.pop()
    }

    const parent = stack[stack.length - 1]
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
    stack.push(node)
  })

  return roots
}

export function MarkdownBlockPreview({
  fallback,
  value,
}: {
  fallback: string
  value?: string
}) {
  const { t } = useTranslation()
  const nodes = parseMarkdownBlock(value ?? '')

  if (!nodes.length) {
    return (
      <p className="text-sm leading-6 text-stone-400">
        {fallback || t('common.noContent')}
      </p>
    )
  }

  return (
    <div className="space-y-2 text-sm leading-6 text-stone-700">
      {renderNodes(nodes)}
    </div>
  )
}

function renderNodes(nodes: MarkdownNode[]) {
  const rendered: ReactElement[] = []
  let index = 0

  while (index < nodes.length) {
    const node = nodes[index]
    if (node.kind === 'paragraph') {
      rendered.push(
        <p key={node.id} className="whitespace-pre-wrap">
          {node.text}
        </p>
      )
      index += 1
      continue
    }

    const group: ListNode[] = []
    const ordered = node.ordered
    while (index < nodes.length) {
      const candidate = nodes[index]
      if (candidate.kind !== 'listItem' || candidate.ordered !== ordered) {
        break
      }
      group.push(candidate)
      index += 1
    }

    rendered.push(renderList(group, ordered, group[0].id))
  }

  return rendered
}

function renderList(items: ListNode[], ordered: boolean, key: string) {
  const List = ordered ? 'ol' : 'ul'

  return (
    <List
      key={key}
      className={cn(
        'space-y-1 pl-5',
        ordered ? 'list-decimal' : 'list-disc'
      )}
    >
      {items.map((item) => (
        <li key={item.id}>
          <span>{item.text}</span>
          {item.children.length ? (
            <div className="mt-1">{renderNodes(item.children)}</div>
          ) : null}
        </li>
      ))}
    </List>
  )
}
