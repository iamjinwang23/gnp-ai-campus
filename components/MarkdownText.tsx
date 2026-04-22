interface MarkdownTextProps {
  text: string
}

function processInline(str: string): React.ReactNode[] {
  const parts = str.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold text-notion-text">{part}</strong>
      : part
  )
}

function TableBlock({ block }: { block: string }) {
  const rows = block.split('\n').filter(l => l.trim() && l.includes('|'))
  if (rows.length < 2) return null
  const parseRow = (row: string) =>
    row.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1)

  const headers = parseRow(rows[0])
  const dataRows = rows.slice(2) // skip separator row
  return (
    <div className="overflow-x-auto my-1">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-notion-text text-white">
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold border border-notion-text/20 text-xs">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, ri) => {
            const cells = parseRow(row)
            return (
              <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-notion-surface'}>
                {cells.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 border border-notion-border text-notion-text leading-relaxed text-xs">
                    {processInline(cell)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function MarkdownText({ text }: MarkdownTextProps) {
  return (
    <div className="space-y-3">
      {text.split('\n\n').map((block, i) => {
        // Code block
        if (block.startsWith('```')) {
          const code = block.replace(/^```[a-z]*\n?/, '').replace(/```$/, '')
          return (
            <pre key={i} className="bg-notion-text/5 rounded-md p-3 text-xs overflow-x-auto font-mono text-notion-text leading-relaxed">
              {code}
            </pre>
          )
        }

        // Table block
        if (block.includes('|') && block.includes('\n') && block.split('\n').some(l => /^\|[-\s|]+\|$/.test(l.trim()))) {
          return <TableBlock key={i} block={block} />
        }

        // Callout / tip block (> prefix)
        if (block.startsWith('> ')) {
          return (
            <div key={i} className="border-l-4 border-notion-accent bg-notion-accent/5 px-4 py-3 rounded-r-md">
              <p className="text-sm text-notion-text leading-relaxed">
                {processInline(block.replace(/^> /, ''))}
              </p>
            </div>
          )
        }

        // Numbered list (single item)
        const listMatch = block.match(/^(\d+)\.\s+(.+)$/)
        if (listMatch) {
          return (
            <div key={i} className="flex gap-2 text-sm">
              <span className="text-notion-accent font-semibold shrink-0">{listMatch[1]}.</span>
              <span className="text-notion-text leading-relaxed">{processInline(listMatch[2])}</span>
            </div>
          )
        }

        // Bullet list block
        if (block.startsWith('- ') || block.startsWith('* ')) {
          const items = block.split('\n').filter(l => l.trim())
          return (
            <ul key={i} className="space-y-1.5">
              {items.map((item, j) => (
                <li key={j} className="flex gap-2 text-sm text-notion-text">
                  <span className="text-notion-accent shrink-0 mt-0.5">•</span>
                  <span className="leading-relaxed">{processInline(item.replace(/^[-*]\s+/, ''))}</span>
                </li>
              ))}
            </ul>
          )
        }

        // Mixed block with inline bullets
        if (block.includes('\n- ') || block.includes('\n* ')) {
          const lines = block.split('\n')
          return (
            <div key={i} className="space-y-1.5">
              {lines.map((line, j) => {
                if (line.startsWith('- ') || line.startsWith('* ')) {
                  return (
                    <div key={j} className="flex gap-2 text-sm">
                      <span className="text-notion-accent shrink-0">•</span>
                      <span className="text-notion-text leading-relaxed">{processInline(line.replace(/^[-*]\s+/, ''))}</span>
                    </div>
                  )
                }
                return (
                  <p key={j} className="text-sm text-notion-text leading-relaxed">
                    {processInline(line)}
                  </p>
                )
              })}
            </div>
          )
        }

        // Numbered list (multi-line)
        if (/^\d+\.\s/.test(block) && block.includes('\n')) {
          const lines = block.split('\n').filter(l => l.trim())
          return (
            <ol key={i} className="space-y-1.5">
              {lines.map((line, j) => {
                const m = line.match(/^(\d+)\.\s+(.+)$/)
                if (m) {
                  return (
                    <li key={j} className="flex gap-2 text-sm">
                      <span className="text-notion-accent font-semibold shrink-0 w-5">{m[1]}.</span>
                      <span className="text-notion-text leading-relaxed">{processInline(m[2])}</span>
                    </li>
                  )
                }
                return <p key={j} className="text-sm text-notion-text leading-relaxed">{processInline(line)}</p>
              })}
            </ol>
          )
        }

        return (
          <p key={i} className="text-sm text-notion-text leading-relaxed">
            {processInline(block)}
          </p>
        )
      })}
    </div>
  )
}
