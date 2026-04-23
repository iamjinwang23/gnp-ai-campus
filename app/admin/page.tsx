export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase-server'
import AdminGuard from '@/components/AdminGuard'
import EmployeeTable from './_components/EmployeeTable'
import { getEmployeeList } from '@/lib/users'

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

interface StageStatus {
  passed: boolean
  attempts: number
  passedAttempt?: number
}

function getStageStatus(results: QuizResult[], stage: string): StageStatus | null {
  const sr = results.filter((r) => r.stage === stage)
  if (sr.length === 0) return null
  const passedRecord = sr.find((r) => r.passed)
  return { passed: !!passedRecord, attempts: sr.length, passedAttempt: passedRecord?.attempt_number }
}

export default async function AdminPage() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('quiz_results')
    .select('*')
    .order('created_at', { ascending: false })

  const allResults: QuizResult[] = data ?? []
  const byEmail = allResults.reduce<Record<string, QuizResult[]>>((acc, r) => {
    ;(acc[r.user_email] ??= []).push(r)
    return acc
  }, {})

  const employees = getEmployeeList()
  const summary = employees.map((emp) => {
    const userResults = byEmail[emp.email] ?? []
    const sorted = [...userResults].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    return {
      ...emp,
      beginner: getStageStatus(userResults, 'beginner'),
      intermediate: getStageStatus(userResults, 'intermediate'),
      lastActivity: sorted[0]?.created_at ?? null,
      history: sorted,
    }
  })

  const beginnerPassed = summary.filter((e) => e.beginner?.passed).length
  const intermediatePassed = summary.filter((e) => e.intermediate?.passed).length

  return (
    <AdminGuard>
      <div className="min-h-screen bg-notion-bg">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-notion-border">
          <div className="max-w-notion mx-auto px-6 h-14 flex items-center justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/gnp-logo.png" alt="GNP AI Campus" className="h-5 w-auto" />
            <span className="text-xs bg-notion-accent text-white px-2.5 py-1 rounded-full font-medium">
              관리자 대시보드
            </span>
          </div>
        </div>

        <div className="max-w-notion mx-auto px-6 py-8">
          <h1 className="font-serif text-2xl font-bold text-notion-text mb-2">직원 AI 진단 현황</h1>
          <p className="text-sm text-notion-secondary mb-6">전체 {employees.length}명 · 이름을 클릭하면 상세 이력을 볼 수 있습니다</p>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-white border border-notion-border rounded-xl p-4">
              <p className="text-xs text-notion-secondary mb-1">전체 직원</p>
              <p className="text-2xl font-bold text-notion-text">{employees.length}명</p>
            </div>
            <div className="bg-white border border-notion-border rounded-xl p-4">
              <p className="text-xs text-notion-secondary mb-1">초급 통과</p>
              <p className="text-2xl font-bold text-notion-text">
                {beginnerPassed}명
                <span className="text-sm font-normal text-notion-secondary ml-1">
                  ({Math.round((beginnerPassed / employees.length) * 100)}%)
                </span>
              </p>
            </div>
            <div className="bg-white border border-notion-border rounded-xl p-4">
              <p className="text-xs text-notion-secondary mb-1">중급 통과</p>
              <p className="text-2xl font-bold text-notion-text">
                {intermediatePassed}명
                <span className="text-sm font-normal text-notion-secondary ml-1">
                  ({Math.round((intermediatePassed / employees.length) * 100)}%)
                </span>
              </p>
            </div>
          </div>

          <EmployeeTable summary={summary} />
        </div>
      </div>
    </AdminGuard>
  )
}
