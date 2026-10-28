// Builds Payload rich text (Lexical JSON) from simple blocks, for seeded pages and articles.
type Block = string | { h2: string } | { list: string[] }

const text = (t: string) => ({ type: 'text', text: t, format: 0, detail: 0, mode: 'normal', style: '', version: 1 })
const base = { direction: 'ltr' as const, format: '' as const, indent: 0, version: 1 }

export function rich(blocks: Block[]) {
  return {
    root: {
      type: 'root',
      ...base,
      children: blocks.map((b) => {
        if (typeof b === 'string') return { type: 'paragraph', ...base, textFormat: 0, children: [text(b)] }
        if ('h2' in b) return { type: 'heading', tag: 'h2', ...base, children: [text(b.h2)] }
        return {
          type: 'list',
          listType: 'bullet',
          start: 1,
          tag: 'ul',
          ...base,
          children: b.list.map((item, i) => ({ type: 'listitem', value: i + 1, ...base, children: [text(item)] })),
        }
      }),
    },
  }
}
