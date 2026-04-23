import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fetchNews } from '@/lib/news'

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const items = await fetchNews()
  const article = items.find((item) => item.id === id)

  if (!article) notFound()

  return (
    <div className="min-h-screen bg-notion-bg">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Back + Category */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/news"
            className="flex items-center gap-1 text-sm text-notion-secondary hover:text-notion-text transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            AI 뉴스
          </Link>
          {article.category && (
            <span className="text-xs text-notion-accent font-medium">{article.category}</span>
          )}
        </div>

        {/* Thumbnail */}
        {article.thumbnail && (
          <div className="aspect-video rounded-xl overflow-hidden mb-6 bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.thumbnail}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Title */}
        <h1 className="font-serif text-2xl font-bold text-notion-text leading-snug mb-3">
          {article.title}
        </h1>

        {/* Meta */}
        <p className="text-xs text-notion-secondary mb-6">
          {article.author}
          {article.author && ' · '}
          {new Date(article.pubDate).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>

        <div className="h-px bg-notion-border mb-6" />

        {/* Article body — images and videos rendered inline */}
        {article.contentHtml && (
          <div
            className="
              text-sm text-notion-text leading-relaxed mb-8
              [&_p]:mb-4
              [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2
              [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
              [&_img]:w-full [&_img]:rounded-lg [&_img]:my-4 [&_img]:object-cover
              [&_iframe]:w-full [&_iframe]:rounded-lg [&_iframe]:my-4 [&_iframe]:aspect-video
              [&_a]:text-notion-accent [&_a]:underline [&_a]:break-all
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4
              [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4
              [&_li]:mb-1
              [&_strong]:font-semibold
              [&_blockquote]:border-l-2 [&_blockquote]:border-notion-border [&_blockquote]:pl-4 [&_blockquote]:text-notion-secondary
            "
            dangerouslySetInnerHTML={{ __html: article.contentHtml }}
          />
        )}

        {/* Original link */}
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-notion-text text-white text-sm rounded-lg hover:bg-notion-accent transition-colors"
        >
          원문 보러가기
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  )
}
