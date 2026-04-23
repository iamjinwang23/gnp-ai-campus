export interface NewsItem {
  id: string
  title: string
  link: string
  author: string
  pubDate: string
  description: string   // short excerpt for card preview
  content: string       // full article text for detail page
  thumbnail: string | null
  category: string
}

const RSS_URL = 'https://cdn.aitimes.com/rss/gn_rss_allArticle.xml'

export async function fetchNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(RSS_URL, { next: { revalidate: 1800 } })
    if (!res.ok) return []
    const xml = await res.text()
    return parseRSS(xml)
  } catch {
    return []
  }
}

function parseRSS(xml: string): NewsItem[] {
  const items: NewsItem[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match: RegExpExecArray | null

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const title = unwrap(getField(block, 'title'))
    const link = getField(block, 'link').trim()
    const author = unwrap(getField(block, 'dc:creator'))
    const pubDateRaw = getField(block, 'pubDate').trim()
    const description = unwrap(getField(block, 'description'))
    const contentRaw = unwrap(getField(block, 'content:encoded'))
    const category = unwrap(getField(block, 'category'))

    const idMatch = link.match(/idxno=(\d+)/)
    const id = idMatch?.[1] ?? encodeURIComponent(link)

    try {
      items.push({
        id,
        title,
        link,
        author,
        pubDate: pubDateRaw ? new Date(pubDateRaw).toISOString() : new Date().toISOString(),
        description: stripHtml(description),
        content: htmlToText(contentRaw),
        thumbnail: extractThumbnail(contentRaw),
        category,
      })
    } catch {
      // skip malformed items
    }
  }

  return items
}

function getField(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return m?.[1] ?? ''
}

function unwrap(s: string): string {
  return s.replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '').trim()
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/gi, '').replace(/\s+/g, ' ').trim()
}

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractThumbnail(content: string): string | null {
  // class="type:primaryImage" before src
  const m1 = content.match(/<img[^>]+class="[^"]*type:primaryImage[^"]*"[^>]+src="([^"]+)"/)
  if (m1) return decodeEntities(m1[1])
  // src before class="type:primaryImage"
  const m2 = content.match(/<img[^>]+src="([^"]+)"[^>]+class="[^"]*type:primaryImage[^"]*"/)
  if (m2) return decodeEntities(m2[1])
  // fallback: first absolute URL image
  const m3 = content.match(/<img[^>]+src="(https?:\/\/[^"]+)"/)
  return m3 ? decodeEntities(m3[1]) : null
}

function decodeEntities(s: string): string {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}
