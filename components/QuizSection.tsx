'use client'

import { useRouter } from 'next/navigation'
import { Level, LEVEL_CONFIG } from '@/hooks/useLearningPath'

interface QuizSectionProps {
  stage: Level
  isVisible: boolean
  isCleared: boolean
}

const QUIZ_META: Record<Level, { duration: string; count: number }> = {
  beginner: { duration: '약 5–8분', count: 10 },
  intermediate: { duration: '약 8–12분', count: 10 },
  advanced: { duration: '약 10–15분', count: 10 },
}

export default function QuizSection({ stage, isVisible, isCleared }: QuizSectionProps) {
  const router = useRouter()
  const config = LEVEL_CONFIG[stage]
  const meta = QUIZ_META[stage]

  if (!isVisible) {
    return (
      <div className="pb-4">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-notion-border text-notion-secondary text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>모든 강의를 읽으면 {config.label} 퀴즈가 열립니다</span>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-4">
      <div className={`bg-white border rounded-xl p-6 transition-all ${
        isCleared ? 'border-green-300 bg-green-50/30' : 'border-notion-accent/40 shadow-sm'
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-serif text-base font-semibold text-notion-text flex items-center gap-2">
              {config.label} 이해도 진단
              {isCleared && (
                <span className="inline-flex items-center gap-1 text-xs font-normal text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  통과
                </span>
              )}
            </h3>
            <p className="text-sm text-notion-secondary mt-0.5">
              {meta.count}문항 · {meta.duration}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {isCleared && (
              <button
                onClick={() => router.push(`/quiz/${stage}`)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-notion-border text-notion-secondary hover:bg-notion-surface transition-colors"
              >
                다시 도전
              </button>
            )}
            {!isCleared && (
              <button
                onClick={() => router.push(`/quiz/${stage}`)}
                className="px-4 py-2 bg-notion-accent text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
              >
                퀴즈 시작
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
