'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import MarkdownText from '@/components/MarkdownText'
import ArticleUploadModal from '@/components/ArticleUploadModal'
import { ArticlePost, deleteArticle } from '@/lib/actions/article'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

interface Props {
  article: ArticlePost
}

export default function ArticleDetailClient({ article: initial }: Props) {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [article, setArticle] = useState(initial)
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  if (loading || !user) return null

  const handleDelete = async () => {
    if (!confirm('이 아티클을 삭제할까요?')) return
    setDeleting(true)
    await deleteArticle(article.id)
    router.replace('/article')
  }

  return (
    <div className="min-h-screen bg-notion-bg">
      <Header />

      <main className="max-w-2xl mx-auto px-6 pt-8 pb-16">
        {/* Back link + admin actions */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/article"
            className="inline-flex items-center gap-1 text-sm text-notion-secondary hover:text-notion-text transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            AI 아티클
          </Link>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditOpen(true)}
                className="px-3 py-1.5 text-xs font-medium border border-notion-border rounded-lg text-notion-secondary hover:bg-notion-surface transition-colors"
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 text-xs font-medium border border-red-200 rounded-lg text-notion-accent hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          )}
        </div>

        {/* Thumbnail */}
        {article.thumbnail_url && (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-6">
            <Image
              src={article.thumbnail_url}
              alt=""
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Title */}
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-notion-text leading-snug">
          {article.title}
        </h1>

        {/* Meta */}
        <p className="mt-2 text-sm text-notion-secondary">
          {article.author_name}
          <span className="mx-2">·</span>
          조회 {article.view_count}회
          <span className="mx-2">·</span>
          {formatDate(article.created_at)}
        </p>

        <div className="mt-5 mb-6 h-px bg-notion-border" />

        {/* Body */}
        {article.body ? (
          <div className="mb-8">
            <MarkdownText text={article.body} />
          </div>
        ) : !article.url ? (
          <p className="text-sm text-notion-secondary italic mb-8">본문이 없습니다.</p>
        ) : null}

        {/* Link button — bottom */}
        {article.url && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg border border-notion-accent text-notion-accent hover:bg-red-50 transition-colors"
          >
            링크 보러가기
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </main>

      {editOpen && isAdmin && (
        <ArticleUploadModal
          user={user}
          article={article}
          onClose={() => setEditOpen(false)}
          onSuccess={(updated) => {
            setArticle(updated)
            setEditOpen(false)
          }}
        />
      )}
    </div>
  )
}
