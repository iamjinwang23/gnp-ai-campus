# Feature Design: 퀴즈 결과 수집 & 관리자 대시보드

## Context Anchor

| WHY | 직원 AI 이해 수준 파악 → 맞춤 후속 교육 계획 수립 |
|-----|------|
| WHO | 교육 담당 관리자(admin), 퀴즈 응시 직원(33명) |
| RISK | RLS 설정 실수로 데이터 노출, service_role key 클라이언트 노출 |
| SUCCESS | 관리자가 /admin에서 모든 직원의 퀴즈 이력을 조회할 수 있음 |
| SCOPE | 퀴즈 결과 저장 + 관리자 대시보드. 강의 이력·이메일 알림 범위 외 |

---

## 1. Overview

**선택 아키텍처**: Option C — Next.js 15 Server Actions + Server Components

- 퀴즈 저장: 클라이언트 → Server Action → Supabase (service_role)
- 관리자 대시보드: Server Component에서 직접 Supabase 조회 → 서버사이드 렌더링
- service_role key는 서버 런타임에서만 접근, 브라우저에 절대 노출 안 됨

---

## 2. 파일 구조

```
gnp-ai-campus/
├── lib/
│   ├── supabase-server.ts          [NEW] service_role key Supabase client
│   ├── actions/
│   │   └── quiz.ts                 [NEW] saveQuizResult Server Action
│   └── users.ts                    [MODIFY] admin: true 플래그 추가
├── contexts/
│   └── AuthContext.tsx             [MODIFY] isAdmin 추가
├── components/
│   └── AdminGuard.tsx              [NEW] admin 전용 접근 가드
├── app/
│   └── admin/
│       ├── page.tsx                [NEW] 관리자 대시보드 (Server Component)
│       └── _components/
│           ├── EmployeeTable.tsx   [NEW] 직원 목록 인터랙티브 테이블
│           └── EmployeeDetail.tsx  [NEW] 클릭 시 상세 이력 확장
└── .env.local                      [MODIFY] Supabase env vars 추가
```

---

## 3. 데이터 모델

### 3.1 Supabase 테이블

```sql
-- 테이블 생성
create table quiz_results (
  id             bigint primary key generated always as identity,
  user_email     text not null,
  user_name      text not null,
  stage          text not null check (stage in ('beginner', 'intermediate')),
  attempt_number int not null,
  score          int not null,
  passed         boolean not null,
  created_at     timestamptz default now()
);

-- 인덱스 (조회 성능)
create index on quiz_results (user_email);
create index on quiz_results (stage);
create index on quiz_results (created_at desc);
```

### 3.2 RLS 정책

```sql
-- RLS 활성화
alter table quiz_results enable row level security;

-- 모든 인증 여부 무관하게 insert 허용 (anon key로도 insert 가능하지만 우리는 server action 사용)
-- insert는 server action에서 service_role key로만 하므로 RLS 별도 insert 정책 불필요

-- select는 service_role key로만 (bypass RLS) → 정책 불필요
-- anon key로 select 시도 시 기본적으로 차단됨 (enable row level security 후 기본 deny)
```

> **핵심**: service_role key는 RLS를 bypass하므로 Server Actions에서만 사용. anon key는 환경에서 제거하거나 insert 전용 정책만 부여.

### 3.3 TypeScript 타입

```typescript
// lib/types.ts 에 추가 또는 각 파일에 인라인 정의
export interface QuizResult {
  id: number
  user_email: string
  user_name: string
  stage: 'beginner' | 'intermediate'
  attempt_number: number
  score: number
  passed: boolean
  created_at: string
}
```

---

## 4. 컴포넌트 설계

### 4.1 `lib/supabase-server.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

export function createServerClient() {
  return createClient(
    process.env.SUPABASE_URL!,          // NEXT_PUBLIC_ 아닌 서버 전용
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

> **주의**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — `NEXT_PUBLIC_` prefix 없이 서버에서만 접근 가능.

### 4.2 `lib/actions/quiz.ts`

```typescript
'use server'

import { createServerClient } from '@/lib/supabase-server'

interface SaveQuizResultInput {
  user_email: string
  user_name: string
  stage: 'beginner' | 'intermediate'
  score: number
  passed: boolean
}

export async function saveQuizResult(input: SaveQuizResultInput): Promise<void> {
  const supabase = createServerClient()

  // 현재 차수 계산: 해당 (email, stage)의 기존 기록 수 + 1
  const { count } = await supabase
    .from('quiz_results')
    .select('*', { count: 'exact', head: true })
    .eq('user_email', input.user_email)
    .eq('stage', input.stage)

  const attempt_number = (count ?? 0) + 1

  await supabase.from('quiz_results').insert({
    ...input,
    attempt_number,
  })
}
```

### 4.3 `lib/users.ts` 변경

```typescript
// User 인터페이스에 admin 필드 추가
export interface User {
  name: string
  email: string
  company: string
  admin?: boolean
}

// 박진왕 항목에 admin: true 추가
{ name: '박진왕', email: 'iamjinwang@gmail.com', company: 'GnPartner', admin: true },
```

### 4.4 `contexts/AuthContext.tsx` 변경

```typescript
interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (u: User) => void
  logout: () => void
  isAdmin: boolean  // [NEW]
}

// Provider 내부
const isAdmin = user?.admin === true
```

### 4.5 `components/AdminGuard.tsx`

```typescript
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.replace('/')
  }, [user, loading, isAdmin, router])

  if (loading || !user || !isAdmin) return null
  return <>{children}</>
}
```

### 4.6 `app/admin/page.tsx` (Server Component)

```typescript
import { createServerClient } from '@/lib/supabase-server'
import AdminGuard from '@/components/AdminGuard'
import EmployeeTable from './_components/EmployeeTable'
import { USERS } from '@/lib/users'

export default async function AdminPage() {
  const supabase = createServerClient()
  const { data: results } = await supabase
    .from('quiz_results')
    .select('*')
    .order('created_at', { ascending: false })

  // 직원별 요약 데이터 계산 (서버에서)
  const employeeSummary = buildSummary(USERS, results ?? [])

  return (
    <AdminGuard>
      <div className="min-h-screen bg-notion-bg">
        {/* 헤더 */}
        <EmployeeTable summary={employeeSummary} allResults={results ?? []} />
      </div>
    </AdminGuard>
  )
}
```

> **주의**: Server Component 내에서 AdminGuard 사용 시 클라이언트 hook이 필요하므로, AdminGuard는 클라이언트 경계(boundary)를 형성. 대안으로 middleware 기반 redirect 고려 가능하나 현재 auth가 localStorage 기반이라 AdminGuard 패턴 유지.

### 4.7 `app/admin/_components/EmployeeTable.tsx`

```typescript
'use client'
// Props: summary (직원별 초급/중급 상태), allResults (전체 이력)
// State: selectedEmail (클릭된 직원)
// 직원 행 클릭 → selectedEmail 변경 → EmployeeDetail 표시
```

### 4.8 `app/admin/_components/EmployeeDetail.tsx`

```typescript
// Props: email, results (필터링된 해당 직원 이력)
// 테이블 형태로 날짜 / 단계 / 차수 / 점수 / 합격여부 표시
```

---

## 5. 데이터 흐름

```
[직원 퀴즈 완료]
  ↓
app/quiz/[stage]/page.tsx (Client Component)
  ↓ saveQuizResult() 호출 (Server Action)
  ↓
lib/actions/quiz.ts ('use server')
  ↓ attempt_number 계산 (SELECT count)
  ↓ INSERT into quiz_results
  ↓
Supabase PostgreSQL

[관리자 /admin 접근]
  ↓
app/admin/page.tsx (Server Component)
  ↓ createServerClient() → SELECT * FROM quiz_results
  ↓ buildSummary(USERS, results)
  ↓ <EmployeeTable> 렌더링 (SSR)
  ↓
브라우저 → 직원 행 클릭 → EmployeeDetail 확장 (Client State)
```

---

## 6. 환경 변수

```bash
# .env.local
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # 절대 NEXT_PUBLIC_ 붙이지 않음
```

---

## 7. 관리자 대시보드 UI 명세

### 7.1 헤더

```
[GNP 로고]     직원 AI 진단 현황                    [관리자]님  [로그아웃]
```

### 7.2 요약 카드

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 전체 직원     │ │ 초급 통과    │ │ 중급 통과    │
│    33명       │ │  N명 (N%)   │ │  N명 (N%)   │
└──────────────┘ └──────────────┘ └──────────────┘
```

### 7.3 직원 목록 테이블

| 이름 | 소속 | 초급 진단 | 중급 진단 | 최근 응시 |
|------|------|----------|----------|---------|
| 김철수 | GnPartner | ✅ 통과 (2차) | ⬜ 미응시 | 4/20 |
| 이영희 | GnPartner | ✅ 통과 (1차) | 🔄 진행중 | 4/21 |
| 박진왕 | GnPartner | ❌ 미통과 | — | 4/19 |

**상태 표시 규칙**:
- `✅ 통과 (N차)`: passed=true인 기록 존재
- `❌ 미통과`: 기록 있으나 passed=true 없음
- `⬜ 미응시`: 해당 stage 기록 없음
- `🔄 진행중`: 기록 있으나 아직 통과 못함 (미통과와 동일)

### 7.4 직원 상세 이력 (행 클릭 시 확장)

```
▼ 김철수 — 퀴즈 이력
┌─────────────┬──────┬──────┬──────┬──────┐
│ 날짜        │ 단계 │ 차수 │ 점수 │ 결과 │
├─────────────┼──────┼──────┼──────┼──────┤
│ 2026-04-18  │ 초급 │ 1차  │ 50점 │ ❌  │
│ 2026-04-20  │ 초급 │ 2차  │ 80점 │ ✅  │
└─────────────┴──────┴──────┴──────┴──────┘
```

---

## 8. 퀴즈 페이지 통합

`app/quiz/[stage]/page.tsx`의 `nextQuestion` 함수에서 마지막 문제 제출 시:

```typescript
// 결과 계산 후
const score = newAnswers.filter((a, i) => a === questions[i].answer).length * 10
const passed = score >= PASSING_SCORE

// Server Action 호출 (비동기, 결과 UI 전환과 동시 진행)
if (user) {
  saveQuizResult({
    user_email: user.email,
    user_name: user.name,
    stage: stage as 'beginner' | 'intermediate',
    score,
    passed,
  }).catch(console.error) // 저장 실패해도 UI는 정상 동작
}
```

---

## 9. 보안 고려사항

| 항목 | 설계 결정 |
|------|---------|
| service_role key 보호 | `NEXT_PUBLIC_` prefix 없이 서버 환경변수로만 관리 |
| 데이터 조회 권한 | Server Component에서만 전체 데이터 조회 (브라우저 직접 접근 불가) |
| 관리자 접근 제어 | AdminGuard: isAdmin false면 `/`로 리디렉션 |
| 데이터 위변조 | Server Action에서 user 정보는 localStorage user.email 신뢰 (기존 auth 체계와 동일) |

---

## 10. Supabase 설정 순서

1. Supabase 대시보드 → 새 프로젝트 생성
2. Table Editor에서 quiz_results 테이블 생성 (또는 SQL Editor에서 스크립트 실행)
3. RLS 활성화 (enable row level security)
4. Settings → API → Project URL + service_role key 복사
5. `.env.local`에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 추가
6. `npm install @supabase/supabase-js`

---

## 11. Implementation Guide

### 11.1 구현 순서

| 순서 | 모듈 | 파일 | 예상 라인 |
|------|------|------|---------|
| 1 | Supabase 패키지 + 서버 클라이언트 | `lib/supabase-server.ts` | ~10 |
| 2 | Admin User + Auth 확장 | `lib/users.ts`, `contexts/AuthContext.tsx` | ~10 |
| 3 | Server Action (quiz 저장) | `lib/actions/quiz.ts` | ~25 |
| 4 | 퀴즈 페이지 통합 | `app/quiz/[stage]/page.tsx` | ~10 수정 |
| 5 | AdminGuard 컴포넌트 | `components/AdminGuard.tsx` | ~20 |
| 6 | 관리자 대시보드 | `app/admin/page.tsx`, `_components/` | ~120 |

### 11.2 의존성

```bash
npm install @supabase/supabase-js
```

### 11.3 Session Guide

**Module Map**:

| Module | 설명 | 파일 | 예상 시간 |
|--------|------|------|---------|
| M1: Supabase 기반 | DB 연결 + 서버 클라이언트 설정 | `lib/supabase-server.ts`, `.env.local`, Supabase SQL | 20분 |
| M2: Auth 확장 | admin 계정 + isAdmin | `lib/users.ts`, `contexts/AuthContext.tsx` | 10분 |
| M3: 결과 저장 | Server Action + 퀴즈 통합 | `lib/actions/quiz.ts`, `app/quiz/[stage]/page.tsx` | 20분 |
| M4: 대시보드 | AdminGuard + 관리자 UI | `components/AdminGuard.tsx`, `app/admin/` | 40분 |

**추천 세션 플랜**:
- 세션 1: M1 + M2 + M3 (Supabase 설정 ~ 결과 저장 검증)
- 세션 2: M4 (관리자 대시보드 전체)

세션별 scope 지정:
```
/pdca do quiz-results --scope M1,M2,M3
/pdca do quiz-results --scope M4
```
