'use client'

import { useState } from 'react'
import { QnAItem } from '@/lib/content'

interface QnASectionProps {
  items: QnAItem[]
}

function MarkdownText({ text }: { text: string }) {
  const processInline = (str: string): React.ReactNode[] => {
    const parts = str.split(/\*\*(.*?)\*\*/g)
    return parts.map((part, i) =>
      i % 2 === 1
        ? <strong key={i} className="font-semibold text-notion-text">{part}</strong>
        : part
    )
  }

  const renderLine = (line: string, key: number) => {
    const numMatch = line.match(/^(\d+)\.\s+(.+)$/)
    if (numMatch) return (
      <div key={key} className="flex gap-2 text-sm">
        <span className="text-notion-accent font-semibold shrink-0">{numMatch[1]}.</span>
        <span className="text-notion-text leading-relaxed">{processInline(numMatch[2])}</span>
      </div>
    )
    const bulletMatch = line.match(/^-\s+(.+)$/)
    if (bulletMatch) return (
      <div key={key} className="flex gap-2 text-sm">
        <span className="text-notion-secondary shrink-0 mt-px">•</span>
        <span className="text-notion-text leading-relaxed">{processInline(bulletMatch[1])}</span>
      </div>
    )
    return (
      <p key={key} className="text-sm text-notion-text leading-relaxed">
        {processInline(line)}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {text.split('\n\n').map((block, bi) => {
        const lines = block.split('\n').filter((l) => l.trim())
        if (lines.length === 1) return renderLine(lines[0], bi)
        return (
          <div key={bi} className="space-y-2">
            {lines.map((line, li) => renderLine(line, li))}
          </div>
        )
      })}
    </div>
  )
}

export default function QnASection({ items }: QnASectionProps) {
  const [openId, setOpenId] = useState<number | null>(null)

  return (
    <section id="qna" className="max-w-notion mx-auto px-6 py-12">
      <div className="mb-8">
        <h2 className="font-serif text-2xl font-semibold text-notion-text">Q&amp;A</h2>
        <p className="mt-1 text-notion-secondary text-sm">자주 묻는 질문들을 모았습니다</p>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const isOpen = openId === item.id
          return (
            <div
              key={item.id}
              className="border border-notion-border rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-notion-surface transition-colors"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-medium text-notion-text pr-4">
                  {item.question}
                </span>
                <svg
                  className={`w-4 h-4 text-notion-secondary shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <div className="px-4 pb-5 pt-3 bg-notion-surface border-t border-notion-border">
                  <MarkdownText text={item.answer} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
