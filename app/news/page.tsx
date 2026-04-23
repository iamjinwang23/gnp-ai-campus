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
      <NewsSection />
      <footer className="max-w-notion mx-auto px-6 py-10 mt-4 border-t border-notion-border">
        <p className="text-notion-secondary text-xs text-center">
          © 2026 GnPartner. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
