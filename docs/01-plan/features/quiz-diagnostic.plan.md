# Plan: 생성형 AI 이해도 진단 시트

**Feature**: quiz-diagnostic
**Date**: 2026-04-22
**Phase**: Plan

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| Problem | 수강생이 자신의 AI 이해도를 객관적으로 파악할 방법이 없어 학습 방향 설정이 어렵다 |
| Solution | 초급→중급 2단계 진단 퀴즈로 이해도를 측정하고 학습 피드백을 제공한다 |
| Function & UX | 객관식 진행형 퀴즈 + 프로그레스바 + 문항별 해설 결과 페이지 |
| Core Value | 학습자 스스로 약점을 파악하고 다음 학습 방향을 결정할 수 있다 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| WHY | 수강생이 학습 후 이해도를 자가 진단하고 부족한 영역을 파악하기 위해 |
| WHO | GNP AI Campus 수강생 (AI 실무 교육 수강 중인 직장인) |
| RISK | 퀴즈 상태 관리 복잡도 — 단계 전환 / 잠금 해제 / 답안 저장이 얽혀 있음 |
| SUCCESS | 초급 10문항 + 중급 10문항 진행 가능, 점수+해설 결과 페이지 정상 동작 |
| SCOPE | QuizSection 컴포넌트 교체 + content.ts 퀴즈 데이터 구조 변경 |

---

## 1. 요구사항

### 1.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| F-01 | 초급(10문항) / 중급(10문항) 2단계 구성 | P0 |
| F-02 | 초급 70점 이상 통과 시 중급 해금 | P0 |
| F-03 | 상단 프로그레스바 (N/10 표시) | P0 |
| F-04 | 객관식 4지선다 선택 → 다음 버튼으로 진행 | P0 |
| F-05 | 결과 페이지: 점수 + 등급 + 메시지 | P0 |
| F-06 | 결과 페이지 하단: 문항별 내 답 + 정답/오답 + 해설 | P0 |
| F-07 | 49점 이하 → "다시 도전하기" CTA 강조 노출 | P0 |
| F-08 | 초급 통과 결과 페이지에 "중급 도전하기" 버튼 노출 | P0 |

### 1.2 비기능 요구사항

- **상태 관리**: 클라이언트 사이드 only (서버 없음, localStorage 미사용)
- **기존 호환**: 현재 `QUIZ_QUESTIONS` 데이터 구조 교체 필요
- **스타일**: 기존 Notion 디자인 토큰 일관 적용

---

## 2. 데이터 구조

### 2.1 content.ts 변경

```typescript
// 기존 제거
export interface QuizQuestion { ... }
export const QUIZ_QUESTIONS: QuizQuestion[] = []

// 신규 추가
export interface DiagnosticQuestion {
  id: number
  level: 'beginner' | 'intermediate'
  question: string
  options: { id: 'A' | 'B' | 'C' | 'D'; text: string }[]
  answer: 'A' | 'B' | 'C' | 'D'
  explanation: string
}

export const BEGINNER_QUESTIONS: DiagnosticQuestion[]   // 10문항
export const INTERMEDIATE_QUESTIONS: DiagnosticQuestion[] // 10문항
```

---

## 3. 상태 머신

```
[stage-select]
  └─ 초급 시작 클릭 → [quiz: beginner, index=0]
  └─ 중급 시작 클릭 (beginnerCleared=true) → [quiz: intermediate, index=0]

[quiz]
  └─ 답 선택 → selectedAnswer 세팅
  └─ 다음 클릭 → answers 배열에 추가
    └─ index < 9 → index + 1
    └─ index = 9 → [result]

[result]
  └─ 다시 도전하기 클릭 → [quiz: 현재 stage, index=0, answers=[]]
  └─ 중급 도전하기 클릭 → [quiz: intermediate, index=0]
  └─ 처음으로 클릭 → [stage-select]
```

### 핵심 State 타입

```typescript
type Screen = 'stage-select' | 'quiz' | 'result'
type Stage = 'beginner' | 'intermediate'

interface State {
  screen: Screen
  stage: Stage
  currentIndex: number           // 0~9
  selectedAnswer: 'A'|'B'|'C'|'D' | null  // 현재 선택 (미확정)
  answers: ('A'|'B'|'C'|'D')[]  // 확정된 답 배열
  beginnerCleared: boolean        // 초급 70점 이상 통과 여부
}
```

---

## 4. 채점 로직

```typescript
const PASSING_SCORE = 70  // 초급 클리어 기준
const RETRY_THRESHOLD = 49  // 다시 풀기 CTA 기준

function calcScore(answers, questions): number {
  const correct = answers.filter((a, i) => a === questions[i].answer).length
  return correct * 10  // 100점 만점
}

function getGrade(score: number) {
  if (score >= 90) return { grade: '우수', message: '매우 훌륭합니다!' }
  if (score >= 70) return { grade: '양호', message: '잘 하고 있습니다!' }
  if (score >= 50) return { grade: '보통', message: '더 학습이 필요합니다.' }
  return { grade: '부족', message: '추가 학습을 권장합니다.' }
}
```

---

## 5. 컴포넌트 구조

```
QuizSection.tsx  (기존 파일 교체)
  └─ StageSelectScreen    — 초급/중급 카드 선택 화면
  └─ QuizScreen           — 퀴즈 진행 화면
       └─ ProgressBar     — 상단 프로그레스바
       └─ QuestionCard    — 문항 + 선택지 4개
       └─ NextButton      — 다음 버튼 (selectedAnswer 없으면 disabled)
  └─ ResultScreen         — 점수 결과 화면
       └─ ScoreHeader     — 점수 + 등급 + 메시지
       └─ CTAButtons      — 다시 도전 / 중급 도전 / 처음으로
       └─ ReviewList      — 문항별 내 답 + 정답/오답 + 해설
```

---

## 6. UI 상세

### StageSelectScreen
- 초급 카드: 제목 + "10문항 · 약 5-8분" + 시작 버튼
- 중급 카드: 초급 미통과 시 잠금 아이콘 + 비활성 스타일 / 통과 시 활성

### QuizScreen
- 상단: `[ ■■■■□□□□□□ ]  Q4 / 10` (프로그레스바)
- 문항 번호 + 질문 텍스트
- A/B/C/D 선택지 (선택 시 `bg-notion-accent text-white` 하이라이트)
- 하단: "다음" 버튼 (`selectedAnswer === null` 이면 disabled + opacity-50)

### ResultScreen
- 상단: 점수 (크게, 예: `72점`) + 등급 뱃지 + 메시지
- CTA 버튼:
  - 49점 이하: "다시 도전하기" 버튼 강조 (primary style)
  - 초급 통과: "중급 도전하기" 버튼 추가
  - 항상: "처음으로" 버튼 (secondary)
- 문항 리뷰 리스트 (10개):
  ```
  Q1. 생성형 AI에 대한 설명으로 가장 적절한 것은?
  내 답: B — 새로운 콘텐츠를 생성하는 AI  ✅ 정답
  해설: 생성형 AI는...
  ```

---

## 7. 성공 기준

| 기준 | 내용 |
|------|------|
| SC-01 | 초급 10문항 순서대로 진행, 마지막 문항 후 결과 페이지 표시 |
| SC-02 | 70점 이상 달성 시 중급 카드 잠금 해제 |
| SC-03 | 49점 이하 시 "다시 도전하기" CTA 강조 노출 |
| SC-04 | 결과 페이지에 모든 문항의 내 답 + 정답/오답 + 해설 표시 |
| SC-05 | 다시 도전하기 클릭 시 1번 문항부터 재시작 |
| SC-06 | 기존 퀴즈 탭 네비게이션 정상 동작 유지 |

---

## 8. 구현 순서

1. `lib/content.ts` — DiagnosticQuestion 타입 + BEGINNER_QUESTIONS + INTERMEDIATE_QUESTIONS 데이터 입력
2. `components/QuizSection.tsx` — 전체 교체 (StageSelect → Quiz → Result 상태 머신)
3. `app/page.tsx` — QuizSection props 변경 반영
