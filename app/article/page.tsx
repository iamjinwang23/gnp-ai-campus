import { getArticles } from '@/lib/actions/article'
import ArticleListClient from './ArticleListClient'

export const revalidate = 0

export default async function ArticlePage() {
  const articles = await getArticles()
  return <ArticleListClient initialArticles={articles} />
}
