'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  const { user, logout, isAdmin } = useAuth()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  const handleTab = (tab: TabType) => {
    onTabChange(tab)
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-notion-border">
      {/* ── Main bar ─────────────────────────────── */}
      <div className="px-6 md:px-8 h-14 flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/gnp-logo.png"
          alt="GNP AI Campus"
          className="h-5 md:h-7 w-auto flex-none"
        />

        {/* Desktop nav */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTab(tab.id)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-notion-surface text-notion-text font-medium'
                  : 'text-notion-secondary hover:text-notion-text hover:bg-notion-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="px-3 py-1.5 text-sm rounded-md text-notion-accent font-medium hover:bg-red-50 transition-colors"
            >
              관리자 대시보드
            </Link>
          )}
        </nav>

        {/* Desktop user section */}
        {user && (
          <div className="hidden md:flex flex-none items-center gap-3">
            <span className="text-xs text-notion-secondary">{user.name}님, 반갑습니다.</span>
            <button
              onClick={handleLogout}
              className="text-xs text-notion-secondary hover:text-notion-text border border-notion-border rounded-md px-2.5 py-1 hover:bg-notion-surface transition-colors"
            >
              로그아웃
            </button>
          </div>
        )}

        {/* Mobile: push hamburger to right */}
        <div className="flex-1 md:hidden" />

        {/* Hamburger button */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="메뉴 열기"
          className="md:hidden p-2 -mr-1 text-notion-secondary hover:text-notion-text transition-colors"
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Mobile dropdown menu ──────────────────── */}
      {menuOpen && (
        <div className="md:hidden border-t border-notion-border bg-white px-4 py-3">
          {user && (
            <p className="text-xs text-notion-secondary px-3 py-2 mb-1">
              {user.name}님, 반갑습니다.
            </p>
          )}
          <nav className="space-y-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTab(tab.id)}
                className={`w-full text-left px-3 py-2.5 text-sm rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-notion-surface text-notion-text font-medium'
                    : 'text-notion-secondary hover:text-notion-text hover:bg-notion-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="block w-full text-left px-3 py-2.5 text-sm text-notion-accent font-medium hover:bg-red-50 rounded-md transition-colors"
              >
                관리자 대시보드
              </Link>
            )}
          </nav>
          {user && (
            <div className="mt-2 pt-2 border-t border-notion-border">
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2.5 text-sm text-notion-secondary hover:text-notion-text hover:bg-notion-surface rounded-md transition-colors"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
