'use client'

import { useState, useEffect, useCallback } from 'react'

export type Level = 'beginner' | 'intermediate' | 'advanced'

export interface LevelConfig {
  label: string
  lectureIds: number[]
  stage: 'beginner' | 'intermediate' | 'advanced'
  clearedKey: string
  nextLevel: Level | null
}

export const LEVEL_CONFIG: Record<Level, LevelConfig> = {
  beginner: {
    label: '초급',
    lectureIds: [1, 2, 3, 4, 5],
    stage: 'beginner',
    clearedKey: 'beginnerCleared',
    nextLevel: 'intermediate',
  },
  intermediate: {
    label: '중급',
    lectureIds: [6, 7, 8, 9, 10],
    stage: 'intermediate',
    clearedKey: 'intermediateCleared',
    nextLevel: 'advanced',
  },
  advanced: {
    label: '고급',
    lectureIds: [11, 12, 13, 14, 15],
    stage: 'advanced',
    clearedKey: 'advancedCleared',
    nextLevel: null,
  },
}

export const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced']

export interface PendingModal {
  type: 'level-complete' | 'course-complete'
  nextLevel?: Level
  nextLabel?: string
}

interface UseLearningPathReturn {
  activeLevel: Level
  readLectures: number[]
  clearedLevels: Level[]
  unlockedLevels: Level[]
  allReadForLevel: boolean
  levelCleared: boolean
  pendingModal: PendingModal | null
  setActiveLevel: (level: Level) => void
  markRead: (lectureId: number) => void
  dismissModal: () => void
}

function computeClearedLevels(): Level[] {
  const cleared: Level[] = []
  if (localStorage.getItem('beginnerCleared') === 'true') cleared.push('beginner')
  if (localStorage.getItem('intermediateCleared') === 'true') cleared.push('intermediate')
  if (localStorage.getItem('advancedCleared') === 'true') cleared.push('advanced')
  return cleared
}

function computeUnlocked(cleared: Level[]): Level[] {
  const unlocked: Level[] = ['beginner']
  cleared.forEach((l) => {
    const next = LEVEL_CONFIG[l].nextLevel
    if (next && !unlocked.includes(next)) unlocked.push(next)
  })
  return unlocked
}

export function useLearningPath(): UseLearningPathReturn {
  const [activeLevel, setActiveLevelState] = useState<Level>('beginner')
  const [readLectures, setReadLectures] = useState<number[]>([])
  const [clearedLevels, setClearedLevels] = useState<Level[]>([])
  const [pendingModal, setPendingModal] = useState<PendingModal | null>(null)

  useEffect(() => {
    // Read lectures from localStorage
    try {
      const stored = localStorage.getItem('readLectures')
      if (stored) setReadLectures(JSON.parse(stored))
    } catch {}

    // Cleared levels
    const cleared = computeClearedLevels()
    setClearedLevels(cleared)

    // Default active level: first unlocked but not cleared, or last cleared
    if (!localStorage.getItem('beginnerCleared')) {
      setActiveLevelState('beginner')
    } else if (!localStorage.getItem('intermediateCleared')) {
      setActiveLevelState('intermediate')
    } else if (!localStorage.getItem('advancedCleared')) {
      setActiveLevelState('advanced')
    } else {
      setActiveLevelState('advanced')
    }

    // pendingLevelUp: one-shot signal from quiz page
    const pending = localStorage.getItem('pendingLevelUp')
    if (pending) {
      localStorage.removeItem('pendingLevelUp')
      // Re-read cleared after quiz page set the new key
      const freshCleared = computeClearedLevels()
      setClearedLevels(freshCleared)

      if (pending === 'complete') {
        setPendingModal({ type: 'course-complete' })
        setActiveLevelState('advanced')
      } else {
        const nextLevel = pending as Level
        setPendingModal({
          type: 'level-complete',
          nextLevel,
          nextLabel: LEVEL_CONFIG[nextLevel].label,
        })
      }
    }
  }, [])

  const unlockedLevels = computeUnlocked(clearedLevels)
  const activeLevelConfig = LEVEL_CONFIG[activeLevel]
  const allReadForLevel = activeLevelConfig.lectureIds.every((id) =>
    readLectures.includes(id)
  )
  const levelCleared = clearedLevels.includes(activeLevel)

  const setActiveLevel = (level: Level) => {
    if (unlockedLevels.includes(level)) {
      setActiveLevelState(level)
    }
  }

  const markRead = useCallback((lectureId: number) => {
    setReadLectures((prev) => {
      if (prev.includes(lectureId)) return prev
      const next = [...prev, lectureId]
      localStorage.setItem('readLectures', JSON.stringify(next))
      return next
    })
  }, [])

  const dismissModal = useCallback(() => {
    setPendingModal(null)
  }, [])

  return {
    activeLevel,
    readLectures,
    clearedLevels,
    unlockedLevels,
    allReadForLevel,
    levelCleared,
    pendingModal,
    setActiveLevel,
    markRead,
    dismissModal,
  }
}
