'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { NewsItem } from '@/lib/news'

const PAGE_SIZE = 20

export default function NewsSection() {
  const router = useRouter()
  const [items, setItems] = useState<NewsItem[]>([])
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/news')
      .then((r) => r.json())
      .then((data: NewsItem[]) => {
        setItems(data)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (loading || !sentinelRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible((v) => v + PAGE_SIZE)
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [loading])

  const shown = items.slice(0, visible)
  const hasMore = visible < items.length

  return (
    <section id="news" className="max-w-notion mx-auto px-6 pb-8">
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-notion-border rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-notion-secondary">뉴스를 불러오지 못했습니다.</p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-notion-secondary">현재 뉴스가 없습니다.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shown.map((item) => (
              <button
                key={item.id}
                onClick={() => router.push(`/news/${item.id}`)}
                className="text-left bg-white border border-notion-border rounded-xl overflow-hidden hover:shadow-sm transition-shadow cursor-pointer w-full"
              >
                <div className="aspect-video relative bg-gray-100">
                  {item.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6m-6-4h6" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-notion-accent font-medium">{item.category}</span>
                    <span className="text-xs text-notion-secondary">·</span>
                    <span className="text-xs text-notion-secondary">
                      {new Date(item.pubDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-notion-text line-clamp-2 mb-1">{item.title}</p>
                  <p className="text-xs text-notion-secondary line-clamp-2">{item.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* sentinel for infinite scroll */}
          {hasMore && <div ref={sentinelRef} className="h-10" />}
        </>
      )}
    </section>
  )
}
