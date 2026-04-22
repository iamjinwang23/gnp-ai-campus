'use client'

import Link from 'next/link'
import { Lecture } from '@/lib/content'

interface LectureSectionProps {
  lectures: Lecture[]
}

export default function LectureSection({ lectures }: LectureSectionProps) {
  return (
    <section id="lectures" className="max-w-notion mx-auto px-6 py-12">
      <div className="mb-8">
        <h2 className="font-serif text-2xl font-semibold text-notion-text">강의목록</h2>
        <p className="mt-1 text-notion-secondary text-sm">
          총 {lectures.length}강 · AI 실무 교육 커리큘럼 · 강의를 클릭하면 상세 내용을 볼 수 있습니다
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {lectures.map((lecture) => (
          <Link
            key={lecture.id}
            href={`/lecture/${lecture.id}`}
            className="group text-left p-4 border rounded-lg transition-all duration-200 bg-notion-surface border-notion-border hover:shadow-md hover:-translate-y-0.5 hover:border-notion-accent/40"
          >
            <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded mb-3 bg-notion-accent text-white">
              {lecture.number}
            </span>
            <h3 className="text-sm font-medium leading-snug text-notion-text group-hover:text-notion-accent transition-colors">
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
            <div className="mt-3 flex items-center gap-1 text-xs text-notion-accent opacity-0 group-hover:opacity-100 transition-opacity">
              <span>강의 보기</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
