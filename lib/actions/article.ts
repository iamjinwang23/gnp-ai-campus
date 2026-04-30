'use server'

import { createServerClient } from '@/lib/supabase-server'

export type ArticleCategory = '정보' | '사례'

export interface ArticlePost {
  id: string
  title: string
  description: string
  url: string | null
  body: string | null
  thumbnail_url: string | null
  author_name: string
  author_email: string
  view_count: number
  created_at: string
  category: ArticleCategory
}

export interface CreateArticleInput {
  title: string
  description: string
  url?: string
  body?: string
  thumbnail_url?: string
  author_name: string
  author_email: string
  category: ArticleCategory
}

export async function getArticles(): Promise<ArticlePost[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('article_posts')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getArticleAndIncrementView(id: string): Promise<ArticlePost | null> {
  const supabase = createServerClient()

  const { data } = await supabase
    .from('article_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) return null

  await supabase
    .from('article_posts')
    .update({ view_count: data.view_count + 1 })
    .eq('id', id)

  return { ...data, view_count: data.view_count + 1 }
}

export async function createArticle(input: CreateArticleInput): Promise<ArticlePost> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('article_posts')
    .insert({
      title: input.title,
      description: input.description,
      url: input.url || null,
      body: input.body || null,
      thumbnail_url: input.thumbnail_url || null,
      author_name: input.author_name,
      author_email: input.author_email,
      category: input.category,
    })
    .select()
    .single()
  return data!
}

export async function updateArticle(
  id: string,
  input: Omit<CreateArticleInput, 'author_name' | 'author_email'>
): Promise<ArticlePost> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('article_posts')
    .update({
      title: input.title,
      description: input.description,
      url: input.url || null,
      body: input.body || null,
      thumbnail_url: input.thumbnail_url || null,
      category: input.category,
    })
    .eq('id', id)
    .select()
    .single()
  return data!
}

export async function deleteArticle(id: string): Promise<void> {
  const supabase = createServerClient()
  await supabase.from('article_posts').delete().eq('id', id)
}

export async function uploadArticleImage(formData: FormData): Promise<string | null> {
  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return null

  const supabase = createServerClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error } = await supabase.storage
    .from('article-images')
    .upload(fileName, buffer, { contentType: file.type, upsert: false })

  if (error) throw new Error(`이미지 업로드 실패: ${error.message}`)

  const { data } = supabase.storage.from('article-images').getPublicUrl(fileName)
  return data.publicUrl
}
