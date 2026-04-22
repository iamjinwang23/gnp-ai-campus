'use client'

import Image from 'next/image'

export type TabType = 'lectures' | 'quiz' | 'qna'

interface HeaderProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const tabs: { id: TabType; label: string }[] = [
  { id: 'lectures', label: '강의목록' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'qna', label: 'Q&A' },
]

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-notion-border">
      <div className="max-w-notion mx-auto px-6 h-14 flex items-center justify-between">
        <Image src="/gnp-logo.png" alt="GNP AI Campus" height={24} width={90} className="h-6 w-auto" />
        <nav className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-notion-surface text-notion-text font-medium'
                  : 'text-notion-secondary hover:text-notion-text hover:bg-notion-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
