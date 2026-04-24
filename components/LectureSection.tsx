'use client'

import Link from 'next/link'
import { Lecture } from '@/lib/content'

interface LectureSectionProps {
  lectures: Lecture[]
  readIds?: number[]
  onRead?: (id: number) => void
}

const LEVEL_LABEL: Record<Lecture['level'], string> = {
  beginner: '초급',
  intermediate: '중급',
  advanced: '고급',
}

const LEVEL_CLS: Record<Lecture['level'], string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced: 'bg-purple-100 text-purple-700',
}

export default function LectureSection({ lectures, readIds = [], onRead }: LectureSectionProps) {
  const readCount = lectures.filter((l) => readIds.includes(l.id)).length

  return (
    <section id="lectures" className="max-w-notion mx-auto px-6 py-12">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-semibold text-notion-text">강의목록</h2>
          {onRead && (
            <span className="text-sm text-notion-secondary">
              <span className="font-medium text-notion-accent">{readCount}</span> / {lectures.length} 읽음
            </span>
          )}
        </div>
        <p className="mt-1 text-notion-secondary text-sm">
          총 {lectures.length}강 · AI 실무 교육 커리큘럼 · 강의를 클릭하면 상세 내용을 볼 수 있습니다
        </p>
        {onRead && lectures.length > 0 && (
          <div className="mt-3 h-1.5 rounded-full bg-notion-border overflow-hidden">
            <div
              className="h-full rounded-full bg-notion-accent transition-all duration-300"
              style={{ width: `${(readCount / lectures.length) * 100}%` }}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {lectures.map((lecture) => {
          const isRead = readIds.includes(lecture.id)
          return (
            <Link
              key={lecture.id}
              href={`/lecture/${lecture.id}`}
              onClick={() => onRead?.(lecture.id)}
              className={`group text-left p-4 border rounded-lg transition-all duration-200 ${
                isRead
                  ? 'bg-white border-notion-border opacity-75'
                  : 'bg-notion-surface border-notion-border hover:shadow-md hover:-translate-y-0.5 hover:border-notion-accent/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-notion-accent text-white">
                  {lecture.number}
                </span>
                <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${LEVEL_CLS[lecture.level]}`}>
                  {LEVEL_LABEL[lecture.level]}
                </span>
                {isRead && (
                  <span className="ml-auto inline-flex items-center gap-0.5 text-xs text-green-600 font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    읽음
                  </span>
                )}
              </div>
              <h3 className={`text-sm font-medium leading-snug transition-colors ${
                isRead ? 'text-notion-secondary' : 'text-notion-text group-hover:text-notion-accent'
              }`}>
                {lecture.title}
              </h3>
              {lecture.description && (
                <p className="mt-1.5 text-xs leading-relaxed text-notion-secondary">
                  {lecture.description}
                </p>
              )}
              {lecture.topics.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {lecture.topics.slice(0, 2).map((topic, i) => (
                    <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-notion-border text-notion-secondary">
                      {topic}
                    </span>
                  ))}
                </div>
              )}
              {!isRead && (
                <div className="mt-3 flex items-center gap-1 text-xs text-notion-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>강의 보기</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
