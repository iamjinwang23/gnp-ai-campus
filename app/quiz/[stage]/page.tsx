'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BEGINNER_QUESTIONS, INTERMEDIATE_QUESTIONS, DiagnosticQuestion } from '@/lib/content'
import { useAuth } from '@/contexts/AuthContext'

// ── Types ──────────────────────────────────────────────────────────────────

type Stage  = 'beginner' | 'intermediate'
type Answer = 'A' | 'B' | 'C' | 'D'
type Screen = 'quiz' | 'result' | 'locked'

interface QuizState {
  screen: Screen
  currentIndex: number
  selectedAnswer: Answer | null
  answers: Answer[]
}

const PASSING_SCORE  = 70
const RETRY_THRESHOLD = 49

// ── Utils ──────────────────────────────────────────────────────────────────

function calcScore(answers: Answer[], questions: DiagnosticQuestion[]): number {
  return answers.filter((a, i) => a === questions[i].answer).length * 10
}

function getGrade(score: number) {
  if (score >= 90) return { grade: '우수', message: '매우 훌륭합니다!',      cls: 'border-green-200 bg-green-50 text-green-700' }
  if (score >= 70) return { grade: '양호', message: '잘 하고 있습니다!',     cls: 'border-blue-200 bg-blue-50 text-blue-700'   }
  if (score >= 50) return { grade: '보통', message: '더 학습이 필요합니다.', cls: 'border-yellow-200 bg-yellow-50 text-yellow-700' }
  return              { grade: '부족', message: '추가 학습을 권장합니다.',  cls: 'border-red-200 bg-red-50 text-red-600'      }
}

// ── Internal components ────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-notion-border rounded-full overflow-hidden">
        <div
          className="h-full bg-notion-accent rounded-full transition-all duration-300"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
      <span className="text-xs text-notion-secondary shrink-0">{current} / {total}</span>
    </div>
  )
}

function OptionButton({ id, text, selected, onSelect }: {
  id: Answer; text: string; selected: boolean; onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm text-left transition-colors ${
        selected
          ? 'bg-notion-accent text-white border-notion-accent'
          : 'bg-white border-notion-border text-notion-text hover:bg-notion-surface'
      }`}
    >
      <span className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold ${
        selected ? 'border-white/60 text-white' : 'border-notion-border text-notion-secondary'
      }`}>
        {id}
      </span>
      <span>{text}</span>
    </button>
  )
}

function ResultScreen({ stage, questions, answers, score, onRetry, onNextStage, onHome }: {
  stage: Stage
  questions: DiagnosticQuestion[]
  answers: Answer[]
  score: number
  onRetry: () => void
  onNextStage: () => void
  onHome: () => void
}) {
  const { grade, message, cls } = getGrade(score)
  const showNextStage = stage === 'beginner' && score >= PASSING_SCORE

  return (
    <div>
      <div className="text-center py-8 border-b border-notion-border mb-6">
        <p className="text-5xl font-bold text-notion-text mb-3">{score}점</p>
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${cls}`}>
          {grade}
        </span>
        <p className="mt-2 text-sm text-notion-secondary">{message}</p>
      </div>

      <div className="flex flex-col gap-2 mb-8">
        <button
          onClick={onRetry}
          className={`w-full py-2.5 text-sm font-medium rounded-lg transition-colors ${
            score <= RETRY_THRESHOLD
              ? 'bg-notion-accent text-white hover:bg-red-600'
              : 'border border-notion-border text-notion-secondary hover:bg-notion-surface'
          }`}
        >
          다시 도전하기
        </button>
        {showNextStage && (
          <button
            onClick={onNextStage}
            className="w-full py-2.5 text-sm font-medium rounded-lg bg-notion-accent text-white hover:bg-red-600 transition-colors"
          >
            중급 도전하기
          </button>
        )}
        <button
          onClick={onHome}
          className="w-full py-2.5 text-sm font-medium rounded-lg text-notion-secondary hover:text-notion-text hover:bg-notion-surface transition-colors"
        >
          처음으로
        </button>
      </div>

      <div>
        <h3 className="font-serif text-sm font-semibold text-notion-text mb-4">문항 리뷰</h3>
        <div className="space-y-4">
          {questions.map((q, i) => {
            const mine = answers[i]
            const correct = mine === q.answer
            const myOption = q.options.find((o) => o.id === mine)
            const correctOption = q.options.find((o) => o.id === q.answer)
            return (
              <div key={q.id} className={`pl-3 border-l-2 ${correct ? 'border-green-400' : 'border-red-400'}`}>
                <p className="text-xs font-semibold text-notion-text mb-1">Q{i + 1}. {q.question}</p>
                <p className={`text-xs mb-0.5 ${correct ? 'text-green-600' : 'text-red-500'}`}>
                  내 답: {mine} — {myOption?.text} {correct ? '✅ 정답' : `❌ 오답 (정답: ${q.answer})`}
                </p>
                {!correct && (
                  <p className="text-xs text-notion-secondary mb-0.5">
                    정답: {q.answer} — {correctOption?.text}
                  </p>
                )}
                <p className="text-xs text-notion-secondary leading-relaxed">{q.explanation}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function QuizPage() {
  const params  = useParams()
  const router  = useRouter()
  const { user, loading } = useAuth()
  const stage   = params.stage as string

  const isValid    = stage === 'beginner' || stage === 'intermediate'
  const questions  = stage === 'beginner' ? BEGINNER_QUESTIONS : INTERMEDIATE_QUESTIONS
  const stageLabel = stage === 'beginner' ? '초급' : '중급'

  const [state, setState] = useState<QuizState>({
    screen: stage === 'intermediate' ? 'locked' : 'quiz',
    currentIndex: 0,
    selectedAnswer: null,
    answers: [],
  })

  useEffect(() => {
    if (!loading && !user) { router.replace('/login'); return }
    if (!isValid) { router.replace('/'); return }
    if (stage === 'intermediate') {
      if (localStorage.getItem('beginnerCleared') === 'true') {
        setState((s) => ({ ...s, screen: 'quiz' }))
      }
    }
  }, [stage, isValid, router])

  if (loading || !user || !isValid) return null

  const selectAnswer = (answer: Answer) => {
    setState((s) => ({ ...s, selectedAnswer: answer }))
  }

  const nextQuestion = () => {
    setState((s) => {
      if (!s.selectedAnswer) return s
      const newAnswers = [...s.answers, s.selectedAnswer]
      if (s.currentIndex < 9) {
        return { ...s, answers: newAnswers, currentIndex: s.currentIndex + 1, selectedAnswer: null }
      }
      const score = newAnswers.filter((a, i) => a === questions[i].answer).length * 10
      if (stage === 'beginner' && score >= PASSING_SCORE) {
        localStorage.setItem('beginnerCleared', 'true')
      }
      return { ...s, answers: newAnswers, screen: 'result', selectedAnswer: null }
    })
  }

  const retryQuiz = () => {
    setState({ screen: 'quiz', currentIndex: 0, selectedAnswer: null, answers: [] })
  }

  const score = state.screen === 'result' ? calcScore(state.answers, questions) : 0
  const q     = questions[state.currentIndex]

  return (
    <div className="min-h-screen bg-notion-bg">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-notion-bg/95 backdrop-blur-sm border-b border-notion-border">
        <div className="max-w-notion mx-auto px-6 h-12 flex items-center justify-between">
          <Link
            href="/#quiz"
            className="flex items-center gap-1.5 text-xs text-notion-secondary hover:text-notion-text transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            진단 홈
          </Link>
          <span className="text-xs font-medium text-notion-secondary">{stageLabel} 진단</span>
          {state.screen === 'quiz' && (
            <span className="text-xs text-notion-secondary">
              {state.currentIndex + 1} / {questions.length}
            </span>
          )}
          {state.screen !== 'quiz' && <span />}
        </div>
      </div>

      <div className="max-w-notion mx-auto px-6 py-10">

        {/* Locked */}
        {state.screen === 'locked' && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="font-serif text-xl font-semibold text-notion-text mb-2">
              초급을 먼저 통과해주세요
            </h2>
            <p className="text-sm text-notion-secondary mb-6">
              초급에서 70점 이상을 받으면 중급이 해금됩니다
            </p>
            <Link
              href="/quiz/beginner"
              className="inline-block px-5 py-2.5 bg-notion-accent text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
            >
              초급 도전하기
            </Link>
          </div>
        )}

        {/* Quiz */}
        {state.screen === 'quiz' && q && (
          <div>
            <div className="mb-8">
              <h1 className="font-serif text-xl font-semibold text-notion-text mb-4">
                {stageLabel} 진단
              </h1>
              <ProgressBar current={state.currentIndex + 1} total={questions.length} />
            </div>
            <p className="text-xs font-semibold text-notion-secondary uppercase tracking-wide mb-2">
              Q{state.currentIndex + 1}
            </p>
            <p className="font-serif text-base font-semibold text-notion-text mb-6 leading-snug">
              {q.question}
            </p>
            <div className="space-y-2.5 mb-8">
              {q.options.map((opt) => (
                <OptionButton
                  key={opt.id}
                  id={opt.id}
                  text={opt.text}
                  selected={state.selectedAnswer === opt.id}
                  onSelect={() => selectAnswer(opt.id)}
                />
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={nextQuestion}
                disabled={state.selectedAnswer === null}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-notion-accent text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {state.currentIndex < 9 ? '다음' : '결과 보기'}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Result */}
        {state.screen === 'result' && (
          <ResultScreen
            stage={stage as Stage}
            questions={questions}
            answers={state.answers}
            score={score}
            onRetry={retryQuiz}
            onNextStage={() => router.push('/quiz/intermediate')}
            onHome={() => router.push('/')}
          />
        )}

      </div>
    </div>
  )
}
