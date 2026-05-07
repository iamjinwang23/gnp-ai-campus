interface MarkdownTextProps {
  text: string
}

function processInline(str: string): React.ReactNode[] {
  // Split on bold (**), italic (* or _), and link ([text](url))
  const token = /(`[^`]+`|\*\*.*?\*\*|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g
  const parts = str.split(token)
  return parts.map((part, i) => {
    if (/^`([^`]+)`$/.test(part)) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-notion-text/8 text-[0.8em] font-mono text-notion-accent border border-notion-border">
          {part.slice(1, -1)}
        </code>
      )
    }
    if (/^\*\*(.*)\*\*$/.test(part)) {
      return <strong key={i} className="font-semibold text-notion-text">{part.slice(2, -2)}</strong>
    }
    if (/^\*([^*]+)\*$/.test(part) || /^_([^_]+)_$/.test(part)) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch) {
      return (
        <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer"
          className="text-notion-accent underline underline-offset-2 hover:opacity-80">
          {linkMatch[1]}
        </a>
      )
    }
    return part
  })
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

function splitBlocks(text: string): string[] {
  // Tokenize code fences as atomic blocks so blank lines inside ``` ... ``` are preserved.
  const out: string[] = []
  const lines = text.split('\n')
  let prose: string[] = []
  let i = 0
  const flushProse = () => {
    if (!prose.length) return
    const joined = prose.join('\n').replace(/^\n+|\n+$/g, '')
    if (joined) out.push(...joined.split(/\n{2,}/))
    prose = []
  }
  while (i < lines.length) {
    if (lines[i].startsWith('```')) {
      flushProse()
      const code: string[] = [lines[i]]
      i++
      while (i < lines.length) {
        code.push(lines[i])
        if (lines[i].startsWith('```')) { i++; break }
        i++
      }
      out.push(code.join('\n'))
      continue
    }
    prose.push(lines[i])
    i++
  }
  flushProse()
  return out
}

export default function MarkdownText({ text }: MarkdownTextProps) {
  return (
    <div className="space-y-3">
      {splitBlocks(text).map((block, i) => {
        // Headings
        if (block.startsWith('### ')) {
          return <h3 key={i} className="font-serif text-base font-bold text-notion-text mt-1">{processInline(block.slice(4))}</h3>
        }
        if (block.startsWith('## ')) {
          return <h2 key={i} className="font-serif text-lg font-bold text-notion-text mt-1">{processInline(block.slice(3))}</h2>
        }
        if (block.startsWith('# ')) {
          return <h1 key={i} className="font-serif text-xl font-bold text-notion-text mt-1">{processInline(block.slice(2))}</h1>
        }

        // Horizontal rule
        if (/^---+$/.test(block.trim())) {
          return <hr key={i} className="border-notion-border" />
        }

        // Code block
        if (block.startsWith('```')) {
          const langMatch = block.match(/^```([a-z]*)/)
          const lang = langMatch?.[1] || ''
          const code = block.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '')
          return (
            <div key={i} className="rounded-lg overflow-hidden border border-notion-border text-xs">
              {lang && (
                <div className="px-3 py-1.5 bg-notion-text/5 border-b border-notion-border font-mono text-notion-secondary">
                  {lang}
                </div>
              )}
              <pre className="bg-[#1e1e1e] text-[#d4d4d4] p-4 overflow-x-auto font-mono leading-relaxed">
                {code}
              </pre>
            </div>
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
