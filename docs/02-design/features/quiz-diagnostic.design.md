# Design: 생성형 AI 이해도 진단 시트

**Feature**: quiz-diagnostic
**Date**: 2026-04-22
**Architecture**: Option C — 단일 파일 + 내부 컴포넌트

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| WHY | 수강생이 학습 후 이해도를 자가 진단하고 부족한 영역을 파악하기 위해 |
| WHO | GNP AI Campus 수강생 (AI 실무 교육 수강 중인 직장인) |
| RISK | 상태 전환 로직 복잡도 — stage/screen/answers/selectedAnswer 4개 상태가 연동 |
| SUCCESS | 초급→결과→중급 전체 플로우 오류 없이 동작, 점수·해설 정확히 표시 |
| SCOPE | QuizSection.tsx 전체 교체 + content.ts 데이터 구조 변경 |

---

## 1. 아키텍처 결정

**Option C 선택 이유**: 총 코드량 ~350줄로 파일 분리 효익보다 단일 파일 응집성이 유리. 내부 컴포넌트를 named function으로 선언해 논리적 분리는 유지하되 import 오버헤드 없음.

---

## 2. 파일 변경 목록

| 파일 | 작업 | 내용 |
|------|------|------|
| `lib/content.ts` | 수정 | QuizQuestion 인터페이스 제거, DiagnosticQuestion + BEGINNER/INTERMEDIATE_QUESTIONS 추가 |
| `components/QuizSection.tsx` | 전체 교체 | 상태 머신 기반 퀴즈 UI |
| `app/page.tsx` | 수정 | QuizSection props 변경 (QUIZ_QUESTIONS → BEGINNER/INTERMEDIATE_QUESTIONS) |

---

## 3. 데이터 모델

### 3.1 DiagnosticQuestion 인터페이스

```typescript
export interface DiagnosticQuestion {
  id: number
  level: 'beginner' | 'intermediate'
  question: string
  options: { id: 'A' | 'B' | 'C' | 'D'; text: string }[]
  answer: 'A' | 'B' | 'C' | 'D'
  explanation: string
}

export const BEGINNER_QUESTIONS: DiagnosticQuestion[]     // 10개
export const INTERMEDIATE_QUESTIONS: DiagnosticQuestion[] // 10개
```

### 3.2 content.ts 제거 대상

```typescript
// 제거
export interface QuizQuestion { ... }
export const QUIZ_QUESTIONS: QuizQuestion[] = []
```

---

## 4. 상태 설계

### 4.1 타입 정의

```typescript
type Screen = 'stage-select' | 'quiz' | 'result'
type Stage  = 'beginner' | 'intermediate'
type Answer = 'A' | 'B' | 'C' | 'D'

interface QuizState {
  screen: Screen
  stage: Stage
  currentIndex: number        // 0~9, 현재 문항
  selectedAnswer: Answer | null  // 현재 문항 선택값 (미확정)
  answers: Answer[]           // 확정된 답 배열 (길이 = 완료 문항 수)
  beginnerCleared: boolean    // 초급 70점 이상 통과 여부 (세션 유지)
}
```

### 4.2 초기 상태

```typescript
const INITIAL_STATE: QuizState = {
  screen: 'stage-select',
  stage: 'beginner',
  currentIndex: 0,
  selectedAnswer: null,
  answers: [],
  beginnerCleared: false,
}
```

### 4.3 상태 전환 규칙

```
startQuiz(stage)
  → { screen: 'quiz', stage, currentIndex: 0, selectedAnswer: null, answers: [] }

selectAnswer(answer)
  → { selectedAnswer: answer }

nextQuestion()
  answers = [...answers, selectedAnswer]
  if currentIndex < 9  → { currentIndex + 1, selectedAnswer: null }
  if currentIndex = 9  → { screen: 'result', selectedAnswer: null }
  (beginnerCleared 갱신: stage=beginner && score >= 70)

retryQuiz()
  → { screen: 'quiz', currentIndex: 0, selectedAnswer: null, answers: [] }

goToStageSelect()
  → { screen: 'stage-select' }
```

---

## 5. 채점 로직

```typescript
const PASSING_SCORE = 70   // 초급 클리어 기준
const RETRY_THRESHOLD = 49 // 다시 풀기 CTA 기준

function calcScore(answers: Answer[], questions: DiagnosticQuestion[]): number {
  return answers.filter((a, i) => a === questions[i].answer).length * 10
}

function getGrade(score: number): { grade: string; message: string; color: string } {
  if (score >= 90) return { grade: '우수', message: '매우 훌륭합니다!',      color: 'text-green-600' }
  if (score >= 70) return { grade: '양호', message: '잘 하고 있습니다!',     color: 'text-blue-600'  }
  if (score >= 50) return { grade: '보통', message: '더 학습이 필요합니다.', color: 'text-yellow-600' }
  return              { grade: '부족', message: '추가 학습을 권장합니다.',  color: 'text-red-500'   }
}
```

---

## 6. 컴포넌트 상세 설계

### 6.1 파일 구조 (QuizSection.tsx 단일 파일)

```
[상단 — 내부 컴포넌트 선언]
  ProgressBar({ current, total })
  StageCard({ stage, locked, onStart })
  OptionButton({ id, text, selected, onSelect })

[화면 컴포넌트]
  StageSelectScreen({ state, onStart })
  QuizScreen({ state, questions, onSelect, onNext })
  ResultScreen({ state, questions, score, grade, onRetry, onNextStage, onHome })

[하단 — 메인 export]
  export default function QuizSection({ beginnerQuestions, intermediateQuestions })
```

### 6.2 ProgressBar

```
[ ████████░░ ]  Q8 / 10
  ← 진행률 바 (h-1.5, bg-notion-accent) + 우측 텍스트
```

- `width: (current / total) * 100 + '%'`
- transition-all duration-300 (부드러운 증가 애니메이션)

### 6.3 StageSelectScreen

```
┌──────────────────────────────────────────┐
│  초급                                    │
│  기본 개념과 도구 이해도                    │
│  10문항 · 약 5-8분                       │
│  [시작하기]                              │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│  🔒 중급   ← beginnerCleared=false 시    │
│  실무 활용과 고급 기법                     │
│  10문항 · 약 8-12분                      │
│  초급을 먼저 통과해주세요                  │  ← 안내 문구
└──────────────────────────────────────────┘
```

- 잠금 상태: `opacity-50 cursor-not-allowed`, 버튼 disabled
- 통과 후: `border-notion-accent/40` 하이라이트 + "도전하기" 버튼 활성

### 6.4 QuizScreen

```
[ ████████░░ ]  Q8 / 10      ← ProgressBar

Q8. 생성형 AI의 '환각(Hallucination)' 현상이란?

  ┌─────────────────────────────────────┐
  │ A  AI가 너무 빠르게 응답하는 것      │  ← 미선택: bg-white border
  └─────────────────────────────────────┘
  ┌─────────────────────────────────────┐
  │ B  AI가 사실이 아닌 정보를 생성하는  │  ← 선택: bg-notion-accent text-white
  └─────────────────────────────────────┘
  ┌─────────────────────────────────────┐
  │ C  AI가 응답을 거부하는 것           │
  └─────────────────────────────────────┘
  ┌─────────────────────────────────────┐
  │ D  AI가 같은 답변을 반복하는 것      │
  └─────────────────────────────────────┘

                    [다음 →]   ← selectedAnswer=null이면 disabled
```

- 선택지 hover: `hover:bg-notion-surface`
- 선택 시: `bg-notion-accent text-white border-notion-accent`
- 다음 버튼 disabled: `opacity-40 cursor-not-allowed`

### 6.5 ResultScreen

```
─────────────────────────────────
        72점
      ┌──────┐
      │ 양호 │   잘 하고 있습니다!
      └──────┘
─────────────────────────────────

  [다시 도전하기]   ← score<=49 시 primary(red), score>49 시 secondary
  [중급 도전하기]   ← stage=beginner && score>=70 시만 노출
  [처음으로]        ← 항상 노출 (tertiary)

─────────────────────────────────
  문항 리뷰

  Q1. 생성형 AI(Generative AI)에 대한 설명으로 가장 적절한 것은?
  내 답: B — 새로운 콘텐츠를 생성하는 AI   ✅ 정답
  해설: 생성형 AI는 기존 데이터를 학습하여...

  Q2. 멀티모달 AI(Multimodal AI)에 대한 설명으로 가장 적절한 것은?
  내 답: A — 여러 언어를 동시에 사용할 수 있는 AI   ❌ 오답 (정답: B)
  해설: 멀티모달 AI는 여러 종류의 데이터 형태를...
  ...
─────────────────────────────────
```

**CTA 버튼 스타일 규칙**:
| 조건 | "다시 도전하기" 스타일 |
|------|----------------------|
| score <= 49 | `bg-notion-accent text-white` (강조) |
| score > 49 | `border border-notion-border text-notion-secondary` (보조) |

**리뷰 아이템 스타일**:
- 정답: `text-green-600` ✅ + 초록 왼쪽 보더
- 오답: `text-red-500` ❌ + 빨간 왼쪽 보더, 정답 항목 명시

---

## 7. props 인터페이스

```typescript
// QuizSection (메인 export)
interface QuizSectionProps {
  beginnerQuestions: DiagnosticQuestion[]
  intermediateQuestions: DiagnosticQuestion[]
}

// app/page.tsx 변경
<QuizSection
  beginnerQuestions={BEGINNER_QUESTIONS}
  intermediateQuestions={INTERMEDIATE_QUESTIONS}
/>
```

---

## 8. 구현 순서 (Session Guide)

### Module 1 — 데이터 (`lib/content.ts`)
- QuizQuestion 인터페이스 + QUIZ_QUESTIONS 제거
- DiagnosticQuestion 인터페이스 추가
- BEGINNER_QUESTIONS 10문항 데이터 입력
- INTERMEDIATE_QUESTIONS 10문항 데이터 입력

### Module 2 — 컴포넌트 (`components/QuizSection.tsx`)
- 상태 타입 + 초기값 선언
- calcScore / getGrade 유틸 함수
- ProgressBar 내부 컴포넌트
- StageSelectScreen 내부 컴포넌트
- QuizScreen 내부 컴포넌트 (OptionButton 포함)
- ResultScreen 내부 컴포넌트 (ReviewList 포함)
- 메인 QuizSection export (useReducer or useState 상태 머신)

### Module 3 — 연결 (`app/page.tsx`)
- import 변경: QUIZ_QUESTIONS → BEGINNER_QUESTIONS, INTERMEDIATE_QUESTIONS
- QuizSection props 업데이트
