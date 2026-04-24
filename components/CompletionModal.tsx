'use client'

import { useEffect, useRef } from 'react'
import { PendingModal, Level } from '@/hooks/useLearningPath'

interface CompletionModalProps {
  modal: PendingModal
  onNext: (level: Level) => void
  onDismiss: () => void
}

export default function CompletionModal({ modal, onNext, onDismiss }: CompletionModalProps) {
  const primaryRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    primaryRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onDismiss() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onDismiss])

  const isFinal = modal.type === 'course-complete'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fadeIn"
        onClick={onDismiss}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center animate-slideUp">
        <div className="text-5xl mb-4">{isFinal ? '🎉' : '✅'}</div>

        <h2 id="modal-title" className="font-serif text-xl font-bold text-notion-text mb-2">
          {isFinal ? '수고하셨습니다!' : `${modal.nextLevel ? '' : ''}단계 완료!`}
        </h2>

        <p className="text-sm text-notion-secondary mb-6 leading-relaxed">
          {isFinal
            ? 'GNP AI Campus 전 과정을 완료하셨습니다.\n앞으로의 AI 실무 활용을 응원합니다.'
            : `${modal.nextLabel} 강의가 열렸습니다.\n바로 시작해볼까요?`
          }
        </p>

        <div className="flex flex-col gap-2">
          {!isFinal && modal.nextLevel && (
            <button
              ref={primaryRef}
              onClick={() => { onNext(modal.nextLevel!); onDismiss() }}
              className="w-full py-2.5 text-sm font-medium rounded-lg bg-notion-accent text-white hover:bg-red-600 transition-colors"
            >
              {modal.nextLabel} 시작하기
            </button>
          )}
          <button
            ref={isFinal ? primaryRef : undefined}
            onClick={onDismiss}
            className={`w-full py-2.5 text-sm font-medium rounded-lg transition-colors ${
              isFinal
                ? 'bg-notion-accent text-white hover:bg-red-600'
                : 'border border-notion-border text-notion-secondary hover:bg-notion-surface'
            }`}
          >
            {isFinal ? '확인' : '나중에'}
          </button>
        </div>
      </div>
    </div>
  )
}
