import { fetchNews } from '@/lib/news'

export const revalidate = 1800

export async function GET() {
  const items = await fetchNews()
  return Response.json(items)
}
