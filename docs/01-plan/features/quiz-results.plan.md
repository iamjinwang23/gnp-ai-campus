# Feature Plan: 퀴즈 결과 수집 & 관리자 대시보드

## Executive Summary

| 관점 | 내용 |
|------|------|
| 문제 | 직원들이 퀴즈를 완료해도 결과가 클라이언트에만 저장되어, 관리자가 각 직원의 AI 이해 수준을 파악할 방법이 없음 |
| 해결 | Supabase PostgreSQL에 퀴즈 시도 이력을 저장하고, 관리자 전용 대시보드를 통해 직원별 통과 이력 조회 |
| 기능/UX | 퀴즈 완료 시 자동 서버 저장 → 관리자 /admin 페이지에서 직원 목록 + 클릭 시 상세 이력 확인 |
| 핵심 가치 | 교육 담당자가 33명 직원 각각의 AI 리터러시 수준을 데이터로 파악하고 후속 교육 계획 수립 가능 |

## Context Anchor

| WHY | 직원 AI 이해 수준 파악 → 맞춤 후속 교육 계획 수립 |
|-----|------|
| WHO | 교육 담당 관리자(admin), 퀴즈 응시 직원(33명) |
| RISK | Supabase 설정 복잡도, RLS(Row Level Security) 설정 실수로 데이터 노출 |
| SUCCESS | 관리자가 /admin에서 모든 직원의 퀴즈 이력을 조회할 수 있음 |
| SCOPE | 퀴즈 결과 저장 + 관리자 대시보드. 강의 이력, 이메일 알림은 범위 외 |

---

## 1. 요구사항

### 1.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-01 | 퀴즈 완료 시 Supabase에 결과 저장 (사용자, 단계, 차수, 점수, 합격여부, 시각) | P0 |
| FR-02 | 동일 사용자가 재시도 시 차수(attempt_number)가 자동 증가 | P0 |
| FR-03 | /admin 페이지: 직원 목록 테이블 (이름, 소속, 초급 상태, 중급 상태, 최근 활동) | P0 |
| FR-04 | 직원 행 클릭 시 해당 직원의 전체 퀴즈 시도 이력 표시 (날짜, 단계, 차수, 점수, 합격여부) | P0 |
| FR-05 | admin 계정 추가 (users.ts에 admin: true 플래그 + AuthContext에서 관리) | P0 |
| FR-06 | /admin 접근 시 admin이 아닌 사용자는 / 로 리디렉션 | P0 |
| FR-07 | 직원 목록에서 미응시자도 표시 (결과 없으면 "미응시" 표시) | P1 |

### 1.2 비기능 요구사항

- Supabase 무료 플랜으로 운영 가능 (소규모 33명)
- RLS(Row Level Security): admin만 전체 데이터 조회 가능
- 기존 localStorage 기반 auth 유지 (Supabase Auth 마이그레이션 없음)

---

## 2. 데이터 모델

### Supabase 테이블: `quiz_results`

```sql
create table quiz_results (
  id            bigint primary key generated always as identity,
  user_email    text not null,
  user_name     text not null,
  stage         text not null check (stage in ('beginner', 'intermediate')),
  attempt_number int not null,
  score         int not null,
  passed        boolean not null,
  created_at    timestamptz default now()
);
```

### 차수(attempt_number) 계산 방식

퀴즈 완료 시 해당 (user_email, stage) 조합의 기존 기록 수를 조회하여 +1.

---

## 3. 관리자(Admin) 설계

### 3.1 Admin 계정 식별

`lib/users.ts`에 `admin: true` 플래그 추가:

```typescript
export interface User {
  name: string
  email: string
  company: string
  admin?: boolean
}
```

초기 admin 계정: `iamjinwang@gmail.com` (박진왕) — 추후 추가 가능

### 3.2 Admin 접근 제어

- `AuthContext`에 `isAdmin` computed 값 추가
- `/admin` 페이지: `AdminGuard` 컴포넌트로 감싸서 admin이 아닌 경우 `/` 리디렉션

---

## 4. 화면 설계

### 4.1 `/admin` — 관리자 대시보드

```
[GNP AI Campus 로고]              [관리자 뱃지] [이름]님, 반갑습니다. [로그아웃]

## 직원 AI 진단 현황
총 33명 | 초급 통과: N명 (N%) | 중급 통과: N명 (N%)

┌──────────┬─────────┬──────────────┬──────────────┬─────────┐
│ 이름     │ 소속    │ 초급 진단    │ 중급 진단    │ 최근 응시│
├──────────┼─────────┼──────────────┼──────────────┼─────────┤
│ 김철수   │ GnPart… │ ✅ 통과 (2차)│ ⬜ 미응시   │ 4/20   │
│ 이영희   │ GnPart… │ ✅ 통과 (1차)│ 🔄 진행중   │ 4/21   │
│ 박진왕   │ GnPart… │ ❌ 미통과    │ -            │ 4/19   │
└──────────┴─────────┴──────────────┴──────────────┴─────────┘
```

### 4.2 직원 상세 이력 (행 클릭 시 확장 또는 모달)

```
김철수 — 퀴즈 이력
┌────────┬──────┬──────┬──────┬──────┐
│ 날짜   │ 단계 │ 차수 │ 점수 │ 결과 │
├────────┼──────┼──────┼──────┼──────┤
│ 4/18  │ 초급 │ 1차  │ 50점 │ ❌  │
│ 4/20  │ 초급 │ 2차  │ 80점 │ ✅  │
└────────┴──────┴──────┴──────┴──────┘
```

---

## 5. 구현 계획

### 5.1 구현 모듈 순서

| 순서 | 모듈 | 파일 | 설명 |
|------|------|------|------|
| 1 | Supabase 설정 | `lib/supabase.ts` | createClient, 환경변수 |
| 2 | DB 테이블 생성 | Supabase Dashboard SQL | quiz_results 테이블 + RLS |
| 3 | Admin 사용자 설정 | `lib/users.ts` | admin: true 플래그 추가 |
| 4 | AuthContext 확장 | `contexts/AuthContext.tsx` | isAdmin 추가 |
| 5 | 퀴즈 결과 저장 | `app/quiz/[stage]/page.tsx` | 완료 시 Supabase insert |
| 6 | Admin 가드 | `components/AdminGuard.tsx` | isAdmin 아니면 / 리디렉션 |
| 7 | 관리자 대시보드 | `app/admin/page.tsx` | 직원 목록 + 이력 조회 |

### 5.2 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 6. 성공 기준

| SC-01 | 퀴즈 완료 후 Supabase에 결과가 1건 저장됨 |
|-------|------------------------------------------|
| SC-02 | 동일 사용자 재시도 시 attempt_number가 +1 증가 |
| SC-03 | /admin 접근 시 admin 아닌 사용자는 /로 리디렉션됨 |
| SC-04 | 관리자가 33명 전원의 초급/중급 상태를 한 화면에서 확인 가능 |
| SC-05 | 직원 클릭 시 해당 직원의 전체 시도 이력(날짜, 점수, 차수, 합격여부) 표시 |

---

## 7. 위험 요소

| 위험 | 영향 | 대응 |
|------|------|------|
| Supabase RLS 설정 실수 | 전체 데이터 노출 | anon key는 insert만, 조회는 service role key 사용 또는 RLS policy로 admin 이메일 검증 |
| Supabase 무료 플랜 한도 | 서비스 중단 | 33명 소규모 → 무료 플랜으로 충분 (50MB DB) |
| localStorage auth와 Supabase 분리 | 사용자 식별 | user.email을 PK로 사용, Supabase Auth 불필요 |
