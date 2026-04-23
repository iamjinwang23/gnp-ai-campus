'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { findUser } from '@/lib/users'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, login } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace('/')
  }, [user, loading, router])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const found = findUser(email, password)
    if (!found) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      setSubmitting(false)
      return
    }

    login(found)
    router.replace('/')
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-notion-bg flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/gnp-logo.png"
            alt="GNP AI Campus"
            className="mx-auto h-10 w-auto mb-6"
          />
          <h1 className="font-serif text-xl font-semibold text-notion-text">로그인</h1>
          <p className="mt-1 text-sm text-notion-secondary">GNP AI Campus에 오신 것을 환영합니다</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-notion-secondary mb-1.5">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-3 py-2.5 text-sm border border-notion-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-notion-accent/20 focus:border-notion-accent transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-notion-secondary mb-1.5">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2.5 text-sm border border-notion-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-notion-accent/20 focus:border-notion-accent transition"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-notion-accent text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  )
}
