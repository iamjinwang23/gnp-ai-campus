'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import NewsSection from '@/components/NewsSection'

export default function NewsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  if (loading || !user) return null

  return (
    <div className="min-h-screen bg-notion-bg">
      <Header />

      {/* Hero */}
      <section className="max-w-notion mx-auto px-6 pt-12 md:pt-20 pb-8 md:pb-10">
        <h1 className="font-serif text-3xl md:text-5xl font-bold text-notion-text leading-tight">
          GNP AI News
        </h1>
        <p className="mt-3 md:mt-4 text-notion-secondary text-sm md:text-base leading-relaxed max-w-lg">
          최신 AI 기술 트렌드부터 업계 주요 소식까지 — 앞서가는 AI 전문가를 위한 뉴스 큐레이션
        </p>
        <div className="mt-6 md:mt-8 h-px bg-notion-border" />
      </section>

      <NewsSection />
      <footer className="max-w-notion mx-auto px-6 py-10 mt-4 border-t border-notion-border">
        <p className="text-notion-secondary text-xs text-center">
          © 2026 GnPartner. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
