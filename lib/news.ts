export interface NewsItem {
  id: string
  title: string
  link: string
  author: string
  pubDate: string
  description: string   // short excerpt for card preview
  contentHtml: string   // sanitized HTML for detail page (images + videos included)
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

    const ALLOWED = ['AI산업', 'AI기업', 'AI기술']
    if (!ALLOWED.includes(category)) continue

    const pubMs = pubDateRaw ? new Date(pubDateRaw).getTime() : 0
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const cutoff = todayStart.getTime() - 24 * 60 * 60 * 1000 // yesterday 00:00
    if (pubMs < cutoff) continue

    try {
      const thumbnail = extractThumbnail(contentRaw)
      items.push({
        id,
        title,
        link,
        author,
        pubDate: pubDateRaw ? new Date(pubDateRaw).toISOString() : new Date().toISOString(),
        description: stripHtml(description),
        contentHtml: sanitizeHtml(contentRaw, thumbnail),
        thumbnail,
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

function sanitizeHtml(html: string, thumbnailUrl?: string | null): string {
  let result = html
    // remove script/style blocks entirely
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    // remove event handlers
    .replace(/\s+on\w+="[^"]*"/gi, '')
    .replace(/\s+on\w+='[^']*'/gi, '')
    // block javascript: hrefs
    .replace(/href="javascript:[^"]*"/gi, 'href="#"')
    // remove type:primaryImage — already shown as cover thumbnail
    .replace(/<img[^>]+class="[^"]*type:primaryImage[^"]*"[^>]*\/?>/gi, '')
    // add loading="lazy" to remaining images
    .replace(/<img(?![^>]*loading=)/gi, '<img loading="lazy"')
    // open external links in new tab
    .replace(/<a\s+href="(https?:\/\/[^"]+)"/gi, '<a href="$1" target="_blank" rel="noopener noreferrer"')

  // also remove any remaining img whose src matches the thumbnail URL
  if (thumbnailUrl) {
    const escaped = thumbnailUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(`<img[^>]+src="${escaped}"[^>]*\\/?>`, 'gi'), '')
  }

  return result
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
