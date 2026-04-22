'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export type TabType = 'lectures' | 'quiz' | 'qna'

interface HeaderProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const tabs: { id: TabType; label: string }[] = [
  { id: 'lectures', label: '강의목록' },
  { id: 'quiz',     label: 'Quiz'   },
  { id: 'qna',      label: 'Q&A'    },
]

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-notion-border">
      <div className="px-8 h-14 flex items-center">
        <Image src="/gnp-logo.png" alt="GNP AI Campus" height={24} width={90} className="h-6 w-auto flex-none" />

        <nav className="flex-1 flex items-center justify-center gap-1">
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

        {user && (
          <div className="flex-none flex items-center gap-3">
            <span className="text-xs text-notion-secondary">
              {user.name}님, 반갑습니다.
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-notion-secondary hover:text-notion-text border border-notion-border rounded-md px-2.5 py-1 hover:bg-notion-surface transition-colors"
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
