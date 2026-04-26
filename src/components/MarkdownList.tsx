import {
  getMarkdownListStyle,
  markdownListItems,
  type MarkdownListStyle,
} from '../lib/markdown/listRendering'

export function MarkdownList({
  text,
  listStyle = getMarkdownListStyle(text),
}: {
  text: string
  listStyle?: MarkdownListStyle
}) {
  const items = markdownListItems(text)
  const List = listStyle === 'ordered' ? 'ol' : 'ul'

  if (items.length === 0) {
    return <p className="text-sm text-stone-500">暂无内容</p>
  }

  return (
    <List
      className={`space-y-1 pl-5 text-sm leading-6 text-stone-800 ${
        listStyle === 'ordered' ? 'list-decimal' : 'list-disc'
      }`}
    >
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </List>
  )
}
