'use client'

import { Level, LEVELS, LEVEL_CONFIG } from '@/hooks/useLearningPath'

interface LevelChipsProps {
  activeLevel: Level
  unlockedLevels: Level[]
  clearedLevels: Level[]
  onSelect: (level: Level) => void
}

export default function LevelChips({ activeLevel, unlockedLevels, clearedLevels, onSelect }: LevelChipsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {LEVELS.map((level) => {
        const config = LEVEL_CONFIG[level]
        const unlocked = unlockedLevels.includes(level)
        const cleared = clearedLevels.includes(level)
        const active = activeLevel === level

        return (
          <button
            key={level}
            onClick={() => onSelect(level)}
            disabled={!unlocked}
            aria-disabled={!unlocked}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
              border transition-all duration-200
              ${active
                ? 'bg-notion-accent text-white border-notion-accent shadow-sm'
                : unlocked
                  ? 'bg-white text-notion-text border-notion-border hover:border-notion-accent/50 hover:text-notion-accent'
                  : 'bg-notion-surface text-notion-secondary border-notion-border cursor-not-allowed opacity-60'
              }
            `}
          >
            {!unlocked && (
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
            {cleared && unlocked && !active && (
              <svg className="w-3.5 h-3.5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {config.label}
          </button>
        )
      })}
    </div>
  )
}
