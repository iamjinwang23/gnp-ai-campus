'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function QuizSection() {
  const router = useRouter()
  const [beginnerCleared, setBeginnerCleared] = useState(false)

  useEffect(() => {
    setBeginnerCleared(localStorage.getItem('beginnerCleared') === 'true')
  }, [])

  return (
    <section id="quiz" className="max-w-notion mx-auto px-6 py-12">
      <div className="mb-8">
        <h2 className="font-serif text-2xl font-semibold text-notion-text">생성형 AI 이해도 진단</h2>
        <p className="mt-1 text-notion-secondary text-sm">내 AI 이해 수준을 확인해보세요</p>
      </div>

      <div className="space-y-4">
        {/* 초급 */}
        <div className={`bg-white border rounded-xl p-6 transition-all ${
          beginnerCleared ? 'border-notion-accent/40 shadow-sm' : 'border-notion-border hover:border-notion-accent/30'
        }`}>
          <h3 className="font-serif text-base font-semibold text-notion-text mb-0.5">
            초급
            {beginnerCleared && <span className="text-xs font-normal text-notion-accent ml-2">✓ 통과</span>}
          </h3>
          <p className="text-sm text-notion-secondary mb-1">기본 개념과 도구 이해도</p>
          <p className="text-xs text-notion-secondary mb-4">10문항 · 약 5–8분</p>
          <button
            onClick={() => router.push('/quiz/beginner')}
            className="px-4 py-2 bg-notion-accent text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
          >
            {beginnerCleared ? '다시 도전하기' : '시작하기'}
          </button>
        </div>

        {/* 중급 */}
        <div className={`bg-white border rounded-xl p-6 transition-all ${
          beginnerCleared
            ? 'border-notion-border hover:border-notion-accent/30'
            : 'border-notion-border opacity-50'
        }`}>
          <h3 className="font-serif text-base font-semibold text-notion-text mb-0.5 flex items-center gap-1.5">
            {!beginnerCleared && <span>🔒</span>}
            중급
          </h3>
          <p className="text-sm text-notion-secondary mb-1">실무 활용과 고급 기법</p>
          <p className="text-xs text-notion-secondary mb-4">10문항 · 약 8–12분</p>
          {beginnerCleared ? (
            <button
              onClick={() => router.push('/quiz/intermediate')}
              className="px-4 py-2 bg-notion-accent text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
            >
              도전하기
            </button>
          ) : (
            <p className="text-xs text-notion-secondary">초급을 먼저 통과해주세요</p>
          )}
        </div>
      </div>
    </section>
  )
}
