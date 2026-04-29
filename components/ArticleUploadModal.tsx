'use client'

import { useEffect, useRef, useState } from 'react'
import { createArticle, updateArticle, uploadArticleImage, ArticlePost } from '@/lib/actions/article'
import { User } from '@/lib/users'

interface Props {
  user: User
  article?: ArticlePost          // edit mode when provided
  onClose: () => void
  onSuccess: (article: ArticlePost) => void
}

export default function ArticleUploadModal({ user, article, onClose, onSuccess }: Props) {
  const isEdit = !!article

  const [title, setTitle] = useState(article?.title ?? '')
  const [description, setDescription] = useState(article?.description ?? '')
  const [url, setUrl] = useState(article?.url ?? '')
  const [body, setBody] = useState(article?.body ?? '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(article?.thumbnail_url ?? null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const titleRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      setError('제목과 한 줄 설명은 필수입니다.')
      return
    }
    setSubmitting(true)
    setError('')

    try {
      // Upload image if a new file was selected
      let thumbnailUrl: string | null = imagePreview && !imageFile ? imagePreview : null
      if (imageFile) {
        const fd = new FormData()
        fd.append('file', imageFile)
        thumbnailUrl = await uploadArticleImage(fd)
      }

      let result: ArticlePost
      if (isEdit) {
        result = await updateArticle(article.id, {
          title: title.trim(),
          description: description.trim(),
          url: url.trim() || undefined,
          body: body.trim() || undefined,
          thumbnail_url: thumbnailUrl ?? undefined,
        })
      } else {
        result = await createArticle({
          title: title.trim(),
          description: description.trim(),
          url: url.trim() || undefined,
          body: body.trim() || undefined,
          thumbnail_url: thumbnailUrl ?? undefined,
          author_name: user.name,
          author_email: user.email,
        })
      }

      onSuccess(result)
    } catch {
      setError('처리 중 오류가 발생했습니다. 다시 시도해주세요.')
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-modal-title"
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white rounded-t-2xl flex items-center justify-between px-6 py-4 border-b border-notion-border">
          <h2 id="article-modal-title" className="font-serif text-lg font-bold text-notion-text">
            {isEdit ? '콘텐츠 수정' : '새 콘텐츠 등록'}
          </h2>
          <button onClick={onClose} className="text-notion-secondary hover:text-notion-text transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-notion-text mb-1">
              제목 <span className="text-notion-accent">*</span>
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="아티클 제목"
              className="w-full px-3 py-2 text-sm border border-notion-border rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-accent/30 focus:border-notion-accent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-notion-text mb-1">
              한 줄 설명 <span className="text-notion-accent">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="리스트에 표시될 한 줄 설명"
              className="w-full px-3 py-2 text-sm border border-notion-border rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-accent/30 focus:border-notion-accent"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs font-medium text-notion-text mb-1">
              링크 URL <span className="text-notion-secondary font-normal">(선택)</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm border border-notion-border rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-accent/30 focus:border-notion-accent"
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-xs font-medium text-notion-text mb-1">
              썸네일 이미지 <span className="text-notion-secondary font-normal">(선택 · 최대 5MB)</span>
            </label>
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border border-notion-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="미리보기" className="w-full h-36 object-cover" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-notion-border rounded-lg flex flex-col items-center justify-center gap-1.5 text-notion-secondary hover:border-notion-accent hover:text-notion-accent transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs">클릭하여 이미지 첨부</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-medium text-notion-text mb-1">
              본문 <span className="text-notion-secondary font-normal">(선택 · 마크다운 지원)</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="# 제목&#10;**굵게**, *기울임*, [링크](https://...)&#10;&#10;본문 내용을 입력하세요"
              rows={6}
              className="w-full px-3 py-2 text-sm border border-notion-border rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-accent/30 focus:border-notion-accent resize-none font-mono"
            />
          </div>

          {error && <p className="text-xs text-notion-accent">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium border border-notion-border rounded-lg text-notion-secondary hover:bg-notion-surface transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-notion-accent text-white hover:bg-red-600 transition-colors disabled:opacity-60"
            >
              {submitting ? (isEdit ? '수정 중...' : '등록 중...') : (isEdit ? '수정하기' : '등록하기')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
