'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lecture } from '@/lib/content'
import { LEVEL_CONFIG, Level } from '@/hooks/useLearningPath'

interface LectureNavProps {
  prev: Lecture | undefined
  next: Lecture | undefined
}

function getRequiredKey(level: Level): string | null {
  const requiredLevel = (Object.entries(LEVEL_CONFIG) as [Level, typeof LEVEL_CONFIG[Level]][])
    .find(([, cfg]) => cfg.nextLevel === level)
  return requiredLevel ? requiredLevel[1].clearedKey : null
}

export default function LectureNav({ prev, next }: LectureNavProps) {
  const [unlockedLevels, setUnlockedLevels] = useState<Level[]>(['beginner'])

  useEffect(() => {
    const unlocked: Level[] = ['beginner']
    if (localStorage.getItem('beginnerCleared') === 'true') unlocked.push('intermediate')
    if (localStorage.getItem('intermediateCleared') === 'true') unlocked.push('advanced')
    setUnlockedLevels(unlocked)
  }, [])

  const nextLocked = next && !unlockedLevels.includes(next.level as Level)

  return (
    <div className="mt-10 pt-6 border-t border-notion-border grid grid-cols-3 items-center gap-4">
      {prev ? (
        <Link href={`/lecture/${prev.id}`} className="flex flex-col gap-1 group">
          <span className="flex items-center gap-1 text-sm font-medium text-notion-text group-hover:text-notion-accent transition-colors min-w-0">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="truncate">{prev.number}. {prev.title}</span>
          </span>
        </Link>
      ) : <div />}

      <Link
        href="/"
        className="flex items-center justify-center gap-1.5 text-xs text-notion-secondary hover:text-notion-text border border-notion-border rounded-lg px-4 py-2.5 transition-colors hover:bg-notion-surface"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        홈으로
      </Link>

      {next ? (
        nextLocked ? (
          <div className="flex flex-col gap-1 items-end overflow-hidden opacity-40 cursor-not-allowed select-none">
            <span className="flex items-center gap-1 text-sm font-medium text-notion-secondary min-w-0 max-w-full">
              <span className="truncate">{next.number}. {next.title}</span>
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <span className="text-xs text-notion-secondary">퀴즈 통과 후 해금</span>
          </div>
        ) : (
          <Link href={`/lecture/${next.id}`} className="flex flex-col gap-1 items-end group overflow-hidden">
            <span className="flex items-center gap-1 text-sm font-medium text-notion-text group-hover:text-notion-accent transition-colors min-w-0 max-w-full">
              <span className="truncate">{next.number}. {next.title}</span>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        )
      ) : <div />}
    </div>
  )
}
