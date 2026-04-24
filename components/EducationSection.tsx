'use client'

import { LECTURES } from '@/lib/content'
import { useLearningPath, LEVEL_CONFIG } from '@/hooks/useLearningPath'
import LevelChips from '@/components/LevelChips'
import LectureSection from '@/components/LectureSection'
import QuizSection from '@/components/QuizSection'
import CompletionModal from '@/components/CompletionModal'

export default function EducationSection() {
  const {
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
  } = useLearningPath()

  const config = LEVEL_CONFIG[activeLevel]
  const levelLectures = LECTURES.filter((l) => config.lectureIds.includes(l.id))

  return (
    <section id="education" className="max-w-notion mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-semibold text-notion-text">AI 교육</h2>
        <p className="mt-1 text-notion-secondary text-sm">
          단계별로 강의를 읽고 퀴즈를 통과하면 다음 단계가 열립니다
        </p>
      </div>

      {/* Level chips */}
      <div className="mb-8">
        <LevelChips
          activeLevel={activeLevel}
          unlockedLevels={unlockedLevels}
          clearedLevels={clearedLevels}
          onSelect={setActiveLevel}
        />
      </div>

      {/* Lectures for active level */}
      <LectureSection
        lectures={levelLectures}
        readIds={readLectures}
        onRead={markRead}
      />

      {/* Quiz — unlocks when all lectures read */}
      <QuizSection
        stage={activeLevel}
        isVisible={allReadForLevel}
        isCleared={levelCleared}
      />

      {/* Completion modal */}
      {pendingModal && (
        <CompletionModal
          modal={pendingModal}
          onNext={setActiveLevel}
          onDismiss={dismissModal}
        />
      )}
    </section>
  )
}
