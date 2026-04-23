# Feature Design: AI 뉴스 탭

## Context Anchor

| 항목 | 내용 |
|------|------|
| WHY | AI 교육 플랫폼에서 최신 AI 동향까지 제공 → 학습 맥락 강화 |
| WHO | 플랫폼 내 전체 직원 (로그인 사용자) |
| RISK | 외부 RSS CORS 이슈, 이미지 도메인 허용, RSS 구조 변경 |
| SUCCESS | AI 뉴스 탭에서 최신 기사 카드 목록 표시, 클릭 시 상세 페이지 이동 |
| SCOPE | RSS 뉴스 목록 + 상세 페이지. 즐겨찾기·검색·카테고리 필터는 범위 외 |

---

## 1. Overview

**선택된 설계안**: Option C — Pragmatic Balance

API Route로 RSS를 파싱·캐시하고, 홈 페이지의 클라이언트 컴포넌트(NewsSection)가 fetch해 카드 그리드를 렌더링한다. 상세 페이지(`/news/[id]`)는 Server Component로 SSR 처리한다.

```
홈(Client)  ←탭클릭→  NewsSection(Client)
                        ↓ fetch
               /api/news (Server, revalidate=1800)
                        ↓ RSS 파싱
               cdn.aitimes.com RSS Feed

카드 클릭 → /news/[id] (Server Component)
            └ /api/news 재호출 후 id 매칭 → 단일 기사 렌더링
```

**선택 근거**:
- 홈 페이지가 `'use client'`이므로 탭 전환 UX를 유지하려면 클라이언트 컴포넌트 필요
- 상세 페이지는 신규 경로이므로 Server Component로 SEO·캐시 활용
- `/api/news`의 `revalidate=1800` 단일 캐시 레이어로 Vercel 함수 호출 최소화

---

## 2. Data Model

### 2.1 NewsItem 타입

```typescript
// lib/news.ts
export interface NewsItem {
  id: string           // URL의 idxno 값 (예: "209631")
  title: string        // 기사 제목
  link: string         // 원문 URL
  author: string       // dc:creator
  pubDate: string      // ISO 8601 변환 날짜
  description: string  // 요약 텍스트 (HTML 태그 제거)
  thumbnail: string | null  // content:encoded primaryImage URL
  category: string     // 카테고리명
}
```

### 2.2 ID 추출

```
URL: https://www.aitimes.com/news/articleView.html?idxno=209631
id  = URL.match(/idxno=(\d+)/)?.[1]  →  "209631"
```

### 2.3 RSS 파싱 전략 (외부 라이브러리 없음)

| 필드 | RSS 소스 | 처리 방식 |
|------|---------|---------|
| title | `<title>` | CDATA 언래핑 |
| link | `<link>` | 그대로 사용 |
| author | `<dc:creator>` | 그대로 사용 |
| pubDate | `<pubDate>` | `new Date().toISOString()` |
| description | `<description>` | HTML 태그 제거 (`/<[^>]+>/g`) |
| thumbnail | `<content:encoded>` | `class="type:primaryImage"` img src 추출 |
| category | `<category>` | 그대로 사용 |
| id | `<link>` | `idxno=(\d+)` 추출 |

---

## 3. API Design

### GET /api/news

**파일**: `app/api/news/route.ts`

```typescript
export const revalidate = 1800  // 30분 ISR 캐시

export async function GET() {
  const items = await fetchNews()  // lib/news.ts
  return Response.json(items)
}
```

**응답 형식**:
```json
[
  {
    "id": "209631",
    "title": "GPT-5 출시...",
    "link": "https://www.aitimes.com/...",
    "author": "홍길동",
    "pubDate": "2026-04-23T09:00:00.000Z",
    "description": "OpenAI가 새로운 모델...",
    "thumbnail": "https://cdn.aitimes.com/news/photo/...",
    "category": "AI 일반"
  }
]
```

**에러 처리**: RSS 파싱 실패 시 빈 배열 `[]` 반환 (graceful fallback)

---

## 4. Component Design

### 4.1 lib/news.ts

```typescript
export async function fetchNews(): Promise<NewsItem[]>
function parseRSS(xml: string): NewsItem[]
function extractThumbnail(content: string): string | null
function stripHtml(html: string): string
```

### 4.2 components/NewsSection.tsx

- `'use client'` 컴포넌트
- 마운트 시 `/api/news` fetch → `NewsItem[]` 상태 저장
- 로딩 중: 스켈레톤 카드 6개 표시
- 카드 그리드: 모바일 1열, 데스크탑 2열
- 카드 클릭: `router.push('/news/${id}')`

**Props**: 없음 (자체 데이터 fetch)

**카드 구성**:
```
┌────────────────────────────┐
│  [썸네일 이미지]            │  ← aspect-video, object-cover
│                            │     없으면 플레이스홀더 bg-gray-100
├────────────────────────────┤
│  카테고리 · 날짜            │  ← text-xs notion-secondary
│  기사 제목 (2줄 clamp)     │  ← text-sm font-medium
│  요약 (2줄 clamp)          │  ← text-xs notion-secondary
└────────────────────────────┘
```

### 4.3 app/news/[id]/page.tsx

- Server Component (기본값)
- `/api/news` 호출 후 `id`로 기사 찾기
- 없으면 `notFound()` 호출
- `← AI 뉴스` 뒤로가기 링크

**레이아웃**:
```
← AI 뉴스              카테고리

[이미지 - aspect-video]

제목 (h1, font-serif)

작성자 · 날짜

요약 내용

[원문 보러가기 →]  target="_blank" rel="noopener noreferrer"
```

### 4.4 components/Header.tsx 수정

```typescript
// TabType 확장
export type TabType = 'news' | 'lectures' | 'quiz' | 'qna'

// tabs 배열 앞에 추가
{ id: 'news', label: 'AI 뉴스' }
```

### 4.5 app/page.tsx 수정

- `activeTab` 초기값: `'news'`
- `handleTabChange`에 `'news'` 케이스 추가
- `NewsSection` import 및 렌더링 추가

### 4.6 next.config.ts 수정

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.aitimes.com',
      },
    ],
  },
}
```

---

## 5. File Structure

```
gnp-ai-campus/
├── lib/
│   └── news.ts                    ← NEW: RSS 파싱 유틸 + NewsItem 타입
├── app/
│   ├── api/
│   │   └── news/
│   │       └── route.ts           ← NEW: GET /api/news, revalidate=1800
│   ├── news/
│   │   └── [id]/
│   │       └── page.tsx           ← NEW: 기사 상세 Server Component
│   └── page.tsx                   ← MODIFY: 'news' 탭 추가, NewsSection 렌더링
├── components/
│   ├── Header.tsx                 ← MODIFY: TabType에 'news', tabs 배열 앞에 추가
│   └── NewsSection.tsx            ← NEW: 뉴스 카드 그리드 클라이언트 컴포넌트
└── next.config.ts                 ← MODIFY: cdn.aitimes.com remotePatterns
```

**신규 파일**: 4개  
**수정 파일**: 3개  
**예상 코드**: ~250줄

---

## 6. State Management

NewsSection은 자체 `useState`로 관리:

```typescript
const [items, setItems] = useState<NewsItem[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(false)
```

- 에러 시: "뉴스를 불러오지 못했습니다" 메시지 표시
- 빈 배열 시: "현재 뉴스가 없습니다" 메시지 표시

---

## 7. Styling

기존 Notion 디자인 토큰 활용:

| 요소 | 클래스 |
|------|--------|
| 카드 컨테이너 | `bg-white border border-notion-border rounded-xl overflow-hidden hover:shadow-sm transition-shadow cursor-pointer` |
| 썸네일 없음 | `bg-gray-100 flex items-center justify-center` |
| 카테고리 태그 | `text-xs text-notion-accent font-medium` |
| 제목 | `text-sm font-medium text-notion-text line-clamp-2` |
| 요약 | `text-xs text-notion-secondary line-clamp-2` |
| 그리드 | `grid grid-cols-1 md:grid-cols-2 gap-4` |
| 원문 버튼 | `inline-flex items-center gap-1 px-4 py-2 bg-notion-text text-white text-sm rounded-lg hover:bg-notion-accent transition-colors` |

---

## 8. Error Handling & Edge Cases

| 케이스 | 처리 방법 |
|--------|---------|
| RSS 서버 다운 | `try/catch` → 빈 배열 반환 |
| 썸네일 없음 | `thumbnail: null` → 플레이스홀더 div |
| `idxno` 없는 URL | `id: link` (전체 URL을 id로 사용) |
| 상세 페이지에서 id 미매칭 | `notFound()` → 404 페이지 |
| description 없음 | 빈 문자열 `""` |

---

## 9. Security

- RSS fetch는 서버 API Route에서만 수행 (CORS 완전 회피)
- 외부 링크 `rel="noopener noreferrer"` 필수
- Next.js Image 컴포넌트로 이미지 최적화 (remotePatterns 허용 도메인만)
- description HTML 태그 strip 후 텍스트만 표시 (XSS 방지)

---

## 10. Non-Functional Requirements

| 항목 | 목표 |
|------|------|
| RSS 캐시 주기 | 30분 (revalidate=1800) |
| 표시 기사 수 | 최신 20개 (RSS 기본 제공량) |
| 이미지 도메인 | cdn.aitimes.com |
| 첫 로드 체감속도 | 스켈레톤으로 레이아웃 시프트 방지 |

---

## 11. Implementation Guide

### 11.1 구현 순서

| 순서 | 모듈 | 파일 | 작업 |
|------|------|------|------|
| M1 | RSS 파싱 유틸 | `lib/news.ts` | NewsItem 타입, fetchNews(), parseRSS() |
| M2 | API Route | `app/api/news/route.ts` | GET /api/news, revalidate=1800 |
| M3 | next.config 이미지 도메인 | `next.config.ts` | cdn.aitimes.com remotePatterns |
| M4 | 뉴스 섹션 컴포넌트 | `components/NewsSection.tsx` | 카드 그리드, 스켈레톤, 클라이언트 fetch |
| M5 | 탭 확장 | `components/Header.tsx`, `app/page.tsx` | 'news' 탭 첫 번째 배치 |
| M6 | 상세 페이지 | `app/news/[id]/page.tsx` | Server Component, 이미지+요약+원문링크 |

### 11.2 핵심 구현 패턴

```typescript
// lib/news.ts - 썸네일 추출
function extractThumbnail(content: string): string | null {
  const m = content.match(/<img[^>]+class="[^"]*type:primaryImage[^"]*"[^>]+src="([^"]+)"/)
  return m?.[1] ?? null
}

// app/news/[id]/page.tsx - 서버 컴포넌트 패턴
export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/news`)
  const items: NewsItem[] = await res.json()
  const article = items.find(item => item.id === id)
  if (!article) notFound()
  // ...render
}
```

### 11.3 Session Guide

| 세션 | 모듈 | 예상 시간 |
|------|------|---------|
| Session 1 | M1 + M2 + M3 | 20분 |
| Session 2 | M4 + M5 | 20분 |
| Session 3 | M6 | 10분 |
