'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface StageStatus {
  passed: boolean
  attempts: number
  passedAttempt?: number
}

interface QuizResult {
  id: number
  user_email: string
  user_name: string
  stage: 'beginner' | 'intermediate'
  attempt_number: number
  score: number
  passed: boolean
  created_at: string
}

interface EmployeeSummary {
  name: string
  email: string
  company: string
  beginner: StageStatus | null
  intermediate: StageStatus | null
  lastActivity: string | null
  history: QuizResult[]
}

function getBestScore(history: QuizResult[], stage: 'beginner' | 'intermediate'): number | undefined {
  const scores = history.filter((r) => r.stage === stage).map((r) => r.score)
  return scores.length > 0 ? Math.max(...scores) : undefined
}

function StatusBadge({ status, bestScore }: { status: StageStatus | null; bestScore?: number }) {
  if (!status) {
    return <span className="text-xs text-notion-secondary">미응시</span>
  }
  if (status.passed) {
    return (
      <span className="text-xs text-green-600 font-medium">
        통과 ({status.passedAttempt}차)
        {bestScore !== undefined && (
          <span className="text-notion-secondary font-normal"> · {bestScore}점</span>
        )}
      </span>
    )
  }
  return (
    <span className="text-xs text-red-500">
      미통과 ({status.attempts}회)
      {bestScore !== undefined && (
        <span className="text-notion-secondary font-normal"> · 최고 {bestScore}점</span>
      )}
    </span>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function EmployeeTable({ summary }: { summary: EmployeeSummary[] }) {
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)
  const { logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  return (
    <div>
      {/* Logout button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleLogout}
          className="text-xs text-notion-secondary hover:text-notion-text border border-notion-border rounded-md px-2.5 py-1 hover:bg-notion-surface transition-colors"
        >
          로그아웃
        </button>
      </div>

      <div className="bg-white border border-notion-border rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_2fr_2fr_2fr_1.5fr] gap-0 border-b border-notion-border bg-notion-surface px-4 py-2.5">
          <span className="text-xs font-semibold text-notion-secondary">이름</span>
          <span className="text-xs font-semibold text-notion-secondary">소속</span>
          <span className="text-xs font-semibold text-notion-secondary">초급 진단</span>
          <span className="text-xs font-semibold text-notion-secondary">중급 진단</span>
          <span className="text-xs font-semibold text-notion-secondary">최근 응시</span>
        </div>

        {/* Table rows */}
        {summary.map((emp) => (
          <div key={emp.email}>
            <button
              onClick={() => setSelectedEmail(selectedEmail === emp.email ? null : emp.email)}
              className="w-full grid grid-cols-[2fr_2fr_2fr_2fr_1.5fr] gap-0 px-4 py-3 border-b border-notion-border hover:bg-notion-surface/50 transition-colors text-left"
            >
              <span className="text-sm font-medium text-notion-text flex items-center gap-1.5">
                <svg
                  className={`w-3 h-3 text-notion-secondary shrink-0 transition-transform ${selectedEmail === emp.email ? 'rotate-90' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {emp.name}
              </span>
              <span className="text-sm text-notion-secondary">{emp.company}</span>
              <StatusBadge status={emp.beginner} bestScore={getBestScore(emp.history, 'beginner')} />
              <StatusBadge status={emp.intermediate} bestScore={getBestScore(emp.history, 'intermediate')} />
              <span className="text-xs text-notion-secondary">
                {emp.lastActivity ? formatDate(emp.lastActivity) : '—'}
              </span>
            </button>

            {/* Detail history */}
            {selectedEmail === emp.email && (
              <div className="bg-notion-surface/30 border-b border-notion-border px-4 py-4">
                {emp.history.length === 0 ? (
                  <p className="text-xs text-notion-secondary text-center py-2">응시 기록이 없습니다.</p>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-notion-text mb-2">{emp.name} — 퀴즈 이력</p>
                    <div className="rounded-lg overflow-hidden border border-notion-border">
                      <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-0 bg-notion-surface px-3 py-2 border-b border-notion-border">
                        <span className="text-xs font-medium text-notion-secondary">날짜</span>
                        <span className="text-xs font-medium text-notion-secondary">단계</span>
                        <span className="text-xs font-medium text-notion-secondary">차수</span>
                        <span className="text-xs font-medium text-notion-secondary">점수</span>
                        <span className="text-xs font-medium text-notion-secondary">결과</span>
                      </div>
                      {emp.history.map((r) => (
                        <div key={r.id} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-0 px-3 py-2 border-b border-notion-border last:border-0 bg-white">
                          <span className="text-xs text-notion-secondary">{formatDateTime(r.created_at)}</span>
                          <span className="text-xs text-notion-text">{r.stage === 'beginner' ? '초급' : '중급'}</span>
                          <span className="text-xs text-notion-text">{r.attempt_number}차</span>
                          <span className="text-xs text-notion-text font-medium">{r.score}점</span>
                          <span className={`text-xs font-medium ${r.passed ? 'text-green-600' : 'text-red-500'}`}>
                            {r.passed ? '통과' : '미통과'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
