'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Header, { TabType } from '@/components/Header'
import LectureSection from '@/components/LectureSection'
import QuizSection from '@/components/QuizSection'
import QnASection from '@/components/QnASection'
import { LECTURES, QNA_ITEMS } from '@/lib/content'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('lectures')

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  if (loading || !user) return null

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    const sectionId = tab === 'lectures' ? 'lectures' : tab === 'quiz' ? 'quiz' : 'qna'
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  return (
    <div className="min-h-screen bg-notion-bg">
      <Header activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Hero */}
      <section className="max-w-notion mx-auto px-6 pt-20 pb-10">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-notion-text leading-tight">
          GNP AI Campus
        </h1>
        <p className="mt-4 text-notion-secondary text-base leading-relaxed max-w-lg">
          생성형 AI부터 바이브코딩까지 — 실무에 바로 쓰는 AI 교육 커리큘럼
        </p>
        <div className="mt-8 h-px bg-notion-border" />
      </section>

      <LectureSection lectures={LECTURES} />

      <div className="max-w-notion mx-auto px-6">
        <div className="h-px bg-notion-border" />
      </div>

      <QuizSection />

      <div className="max-w-notion mx-auto px-6">
        <div className="h-px bg-notion-border" />
      </div>

      <QnASection items={QNA_ITEMS} />

      <footer className="max-w-notion mx-auto px-6 py-10 mt-4 border-t border-notion-border">
        <p className="text-notion-secondary text-xs text-center">
          © 2026 GnPartner. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
