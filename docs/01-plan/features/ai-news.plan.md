# Feature Plan: AI 뉴스 탭

## Executive Summary

| 관점 | 내용 |
|------|------|
| 문제 | 교육 플랫폼에서 AI 업계 최신 동향을 별도로 확인해야 해, 직원들의 학습 맥락 연결이 부족함 |
| 해결 | AI타임스 RSS 피드를 서버에서 30분 캐시로 파싱해 헤더 첫 번째 탭 "AI 뉴스"로 제공 |
| 기능/UX | 카드 리스트(썸네일·제목·날짜·카테고리) → 클릭 시 상세 페이지(이미지·요약·원문 링크) |
| 핵심 가치 | AI 교육과 실시간 업계 뉴스를 한 화면에서 접할 수 있어 학습 몰입도 향상 |

## Context Anchor

| WHY | AI 교육 플랫폼에서 최신 AI 동향까지 제공 → 학습 맥락 강화 |
|-----|------|
| WHO | 플랫폼 내 전체 직원 (로그인 사용자) |
| RISK | 외부 RSS CORS 이슈, 이미지 도메인 허용, RSS 구조 변경 |
| SUCCESS | AI 뉴스 탭에서 최신 기사 카드 목록이 표시되고, 클릭 시 상세 페이지 이동 |
| SCOPE | RSS 뉴스 목록 + 상세 페이지. 뉴스 즐겨찾기·검색·카테고리 필터는 범위 외 |

---

## 1. 요구사항

### 1.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-01 | 헤더 탭 첫 번째에 "AI 뉴스" 추가 (기존: 강의목록·Quiz·Q&A → 변경: AI뉴스·강의목록·Quiz·Q&A) | P0 |
| FR-02 | AI 뉴스 탭 클릭 시 카드 그리드 표시 (썸네일 + 제목 + 날짜 + 카테고리 + 요약 1~2줄) | P0 |
| FR-03 | 카드 클릭 시 `/news/[id]` 상세 페이지로 이동 | P0 |
| FR-04 | 상세 페이지: 이미지 + 요약(description) + "원문 보러가기" 버튼 (새 탭) | P0 |
| FR-05 | RSS → JSON API Route (`/api/news`) — 30분 revalidate 캐시 | P0 |
| FR-06 | 썸네일: `content:encoded` 내 `class="type:primaryImage"` 이미지 추출 | P1 |
| FR-07 | 썸네일 없는 기사는 기본 플레이스홀더 표시 | P1 |

### 1.2 비기능 요구사항

- RSS 피드 URL: `https://cdn.aitimes.com/rss/gn_rss_allArticle.xml`
- 기사 수: 최신 20개 표시 (RSS 기본 제공량)
- 이미지 도메인: `cdn.aitimes.com` → `next.config` images.remotePatterns 추가
- 서버사이드 fetch로 CORS 문제 회피 (브라우저에서 RSS 직접 호출 안 함)

---

## 2. 데이터 모델

### RSS 아이템 → NewsItem 타입

```typescript
interface NewsItem {
  id: string           // URL의 idxno 값 (예: "209631")
  title: string        // 기사 제목
  link: string         // 원문 URL
  author: string       // dc:creator
  pubDate: string      // ISO 8601 변환된 날짜
  description: string  // 요약 텍스트 (HTML 태그 제거)
  thumbnail: string | null  // content:encoded에서 추출한 primaryImage URL
  category: string     // 카테고리
}
```

### ID 추출 방식

```
URL: https://www.aitimes.com/news/articleView.html?idxno=209631
→ id = "209631"
```

---

## 3. 화면 설계

### 3.1 AI 뉴스 목록 (`/` 홈 - AI 뉴스 탭 선택 시)

```
[AI 뉴스]  강의목록  Quiz  Q&A

━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI 뉴스
최신 AI 업계 소식을 확인하세요

┌─────────────┐  ┌─────────────┐
│  [썸네일]   │  │  [썸네일]   │
│             │  │             │
│ 제목 제목   │  │ 제목 제목   │
│ 카테고리 · 날짜│  │ 카테고리 · 날짜│
│ 요약 텍스트  │  │ 요약 텍스트  │
└─────────────┘  └─────────────┘
...
```

모바일: 1열, 데스크탑: 2열 그리드

### 3.2 기사 상세 페이지 (`/news/[id]`)

```
← AI 뉴스              카테고리

[이미지]

제목 제목 제목 제목

작성자 · 날짜

요약 내용 (description)
...

[원문 보러가기 →]  (외부 링크, 새 탭)
```

---

## 4. 구현 계획

### 4.1 구현 모듈 순서

| 순서 | 모듈 | 파일 | 설명 |
|------|------|------|------|
| M1 | RSS 파싱 유틸 | `lib/news.ts` | fetchNews(), parseRSS(), NewsItem 타입 |
| M2 | API Route | `app/api/news/route.ts` | GET /api/news, revalidate=1800 |
| M3 | 뉴스 섹션 컴포넌트 | `components/NewsSection.tsx` | 카드 그리드, 클라이언트 fetch |
| M4 | 탭 확장 | `components/Header.tsx`, `app/page.tsx` | TabType에 'news' 추가, 첫 탭으로 배치 |
| M5 | 상세 페이지 | `app/news/[id]/page.tsx` | Server Component, 이미지+요약+원문링크 |
| M6 | next.config 이미지 도메인 | `next.config.ts` | cdn.aitimes.com remotePatterns 추가 |

### 4.2 RSS 파싱 전략

외부 라이브러리 없이 구현:
```typescript
// content:encoded에서 primaryImage 추출
const thumbMatch = content.match(/<img[^>]+class="[^"]*type:primaryImage[^"]*"[^>]+src="([^"]+)"/)
// description에서 HTML 태그 제거
const text = description.replace(/<[^>]+>/g, '').trim()
// idxno 추출
const idMatch = link.match(/idxno=(\d+)/)
```

---

## 5. 성공 기준

| SC-01 | 홈 페이지에서 "AI 뉴스"가 첫 번째 탭으로 표시됨 |
|-------|------------------------------------------|
| SC-02 | AI 뉴스 탭 클릭 시 최신 기사 카드 목록이 표시됨 |
| SC-03 | 카드에 썸네일 이미지가 표시됨 (없으면 플레이스홀더) |
| SC-04 | 카드 클릭 시 `/news/[id]` 상세 페이지로 이동 |
| SC-05 | 상세 페이지에서 "원문 보러가기" 버튼이 새 탭으로 열림 |
| SC-06 | RSS는 30분 캐시로 Vercel 과부하 없이 운영됨 |

---

## 6. 위험 요소

| 위험 | 영향 | 대응 |
|------|------|------|
| RSS 구조 변경 | 파싱 실패 | try/catch로 graceful fallback (빈 배열 반환) |
| 외부 이미지 CORS | Next.js Image 컴포넌트 경고 | next.config remotePatterns 설정 |
| RSS CORS (브라우저) | 클라이언트에서 직접 호출 불가 | API Route를 통한 서버사이드 fetch로 해결 |
| Vercel 무료 플랜 함수 실행 | 비용 | 30분 캐시로 함수 호출 최소화 |
