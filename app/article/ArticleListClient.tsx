'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import ArticleUploadModal from '@/components/ArticleUploadModal'
import { ArticlePost, ArticleCategory } from '@/lib/actions/article'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return '오늘'
  if (days === 1) return '1일 전'
  if (days < 30) return `${days}일 전`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}개월 전`
  return `${Math.floor(months / 12)}년 전`
}

interface Props {
  initialArticles: ArticlePost[]
}

export default function ArticleListClient({ initialArticles }: Props) {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [articles, setArticles] = useState<ArticlePost[]>(initialArticles)
  const [modalOpen, setModalOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<'전체' | ArticleCategory>('전체')

  const filteredArticles = activeCategory === '전체'
    ? articles
    : articles.filter((a) => a.category === activeCategory)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  if (loading || !user) return null

  return (
    <div className="min-h-screen bg-notion-bg">
      <Header />

      <main className="max-w-notion mx-auto px-6 pt-10 md:pt-16 pb-16">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-notion-text">
              GNP AI 아티클
            </h1>
            <p className="mt-1 text-sm text-notion-secondary">
              관리자가 직접 선별한 AI 아티클을 공유합니다
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-notion-accent text-white hover:bg-red-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새 글
            </button>
          )}
        </div>

        <div className="h-px bg-notion-border mb-4" />

        {/* Category chips */}
        <div className="flex gap-2 mb-5">
          {(['전체', '정보', '사례'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 text-sm rounded-full border transition-colors ${
                activeCategory === cat
                  ? 'bg-notion-accent text-white border-notion-accent'
                  : 'border-notion-border text-notion-secondary hover:border-notion-accent hover:text-notion-accent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Article list */}
        {filteredArticles.length === 0 ? (
          <p className="text-center text-notion-secondary py-20 text-sm">
            아직 등록된 아티클이 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-notion-border">
            {filteredArticles.map((article) => (
              <li key={article.id}>
                <Link
                  href={`/article/${article.id}`}
                  className="flex items-start gap-4 py-4 hover:bg-notion-surface rounded-lg px-3 -mx-3 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="flex-none w-[120px] h-[68px] rounded-md overflow-hidden bg-notion-border">
                    {article.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={article.thumbnail_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-notion-secondary">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-50 text-notion-accent border border-red-100">
                        {article.category}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-notion-text truncate leading-snug">
                      {article.title}
                    </p>
                    <p className="mt-0.5 text-xs text-notion-secondary truncate">
                      {article.description}
                    </p>
                    <p className="mt-1.5 text-xs text-notion-secondary">
                      {article.author_name}
                      <span className="mx-1.5">·</span>
                      조회 {article.view_count}회
                      <span className="mx-1.5">·</span>
                      {timeAgo(article.created_at)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      {isAdmin && modalOpen && (
        <ArticleUploadModal
          user={user}
          onClose={() => setModalOpen(false)}
          onSuccess={(newArticle) => {
            setArticles((prev) => [newArticle, ...prev])
            setModalOpen(false)
          }}
        />
      )}
    </div>
  )
}
