import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LECTURES } from '@/lib/content'
import MarkdownText from '@/components/MarkdownText'
import AuthGuard from '@/components/AuthGuard'

interface Props {
  params: Promise<{ id: string }>
}

export function generateStaticParams() {
  return LECTURES.map((l) => ({ id: String(l.id) }))
}

export default async function LecturePage({ params }: Props) {
  const { id } = await params
  const lecture = LECTURES.find((l) => l.id === Number(id))
  if (!lecture) notFound()

  const prev = LECTURES.find((l) => l.id === lecture.id - 1)
  const next = LECTURES.find((l) => l.id === lecture.id + 1)

  return (
    <AuthGuard>
    <div className="min-h-screen bg-notion-bg">
      <div className="sticky top-0 z-50 bg-notion-bg/95 backdrop-blur-sm border-b border-notion-border">
        <div className="max-w-notion mx-auto px-6 h-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-xs text-notion-secondary hover:text-notion-text transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            강의목록
          </Link>
          <span className="text-xs text-notion-secondary font-medium">{lecture.id} / {LECTURES.length}</span>
        </div>
      </div>
      <div className="bg-notion-text">
        <div className="max-w-notion mx-auto px-6 py-8 md:py-10">
          <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">{lecture.number}</span>
          <h1 className="mt-2 font-serif text-xl md:text-3xl font-bold text-white leading-snug">{lecture.title}</h1>
          {lecture.description && <p className="mt-2 text-sm text-white/60 leading-relaxed">{lecture.description}</p>}
          {lecture.topics.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {lecture.topics.map((topic, i) => (
                <span key={i} className="text-xs px-2.5 py-1 bg-white/15 text-white/80 rounded-full">{topic}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="max-w-notion mx-auto px-6 py-10">
        <div className="space-y-8">
          {lecture.sections.map((section, i) => (
            <div key={i} className="bg-notion-surface border border-notion-border rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-notion-border bg-white">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-notion-accent text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <h2 className="font-serif text-base font-semibold text-notion-text">{section.title}</h2>
                </div>
              </div>
              <div className="px-6 py-5"><MarkdownText text={section.content} /></div>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-notion-border grid grid-cols-3 items-center gap-4">
          {prev ? (
            <Link href={`/lecture/${prev.id}`} className="flex flex-col gap-1 group">
              <span className="flex items-center gap-1 text-sm font-medium text-notion-text group-hover:text-notion-accent transition-colors min-w-0">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                <span className="truncate">{prev.number}. {prev.title}</span>
              </span>
            </Link>
          ) : <div />}
          <Link href="/" className="flex items-center justify-center gap-1.5 text-xs text-notion-secondary hover:text-notion-text border border-notion-border rounded-lg px-4 py-2.5 transition-colors hover:bg-notion-surface">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            홈으로
          </Link>
          {next ? (
            <Link href={`/lecture/${next.id}`} className="flex flex-col gap-1 items-end group overflow-hidden">
              <span className="flex items-center gap-1 text-sm font-medium text-notion-text group-hover:text-notion-accent transition-colors min-w-0 max-w-full">
                <span className="truncate">{next.number}. {next.title}</span>
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </span>
            </Link>
          ) : <div />}
        </div>
      </div>
    </div>
    </AuthGuard>
  )
}
