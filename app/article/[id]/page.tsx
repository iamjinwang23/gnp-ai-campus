import { getArticleAndIncrementView, getArticles } from '@/lib/actions/article'
import ArticleDetailClient from './ArticleDetailClient'
import { notFound } from 'next/navigation'

export const revalidate = 0

export async function generateStaticParams() {
  const articles = await getArticles()
  return articles.map((a) => ({ id: a.id }))
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function ArticleDetailPage({ params }: Props) {
  const { id } = await params
  const article = await getArticleAndIncrementView(id)
  if (!article) notFound()
  return <ArticleDetailClient article={article} />
}
