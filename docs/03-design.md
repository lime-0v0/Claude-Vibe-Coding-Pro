# 03-design.md — 기술·디자인 결정표

> 이 문서에 사유가 기록되지 않은 의존성은 도입할 수 없다.
> 새 라이브러리·패키지·외부 서비스를 추가하려면 이 문서에 먼저 항목을 추가하고 승인을 받는다.

---

## 기술 결정 8선

### 1. 백엔드 프레임워크

| 항목 | 내용 |
|------|------|
| **선택** | FastAPI |
| **대안** | Django, Express (Node.js) |
| **근거** | 타입 힌트 기반 자동 문서화(Swagger UI), 비동기 지원, 경량 구조로 MVP 속도 최적. Pydantic으로 입력 검증이 선언적으로 해결됨 |
| **트레이드오프** | Django 대비 관리자 화면·ORM·인증 등 내장 기능 없음. Express 대비 Python 생태계로 한정됨 |

---

### 2. 프론트엔드

| 항목 | 내용 |
|------|------|
| **선택** | Vanilla JS + Tailwind CSS (CDN) |
| **대안** | React, Vue |
| **근거** | MVP 규모(단일 페이지, 단순 상태)에서 프레임워크 빌드 환경 구성 비용이 실익보다 크다. CDN 한 줄로 즉시 시작 가능, 번들러 없음 |
| **트레이드오프** | 컴포넌트 재사용·상태 관리가 수동. 기능 확장 시 React 전환 비용 발생. 단, MVP 범위 내에서는 문제 없음 |

---

### 3. 데이터베이스

| 항목 | 내용 |
|------|------|
| **선택** | SQLite (개발) → PostgreSQL (프로덕션), ORM: SQLAlchemy |
| **대안** | MySQL, MongoDB |
| **근거** | SQLite는 파일 하나로 로컬 개발 환경을 즉시 구성. SQLAlchemy로 DB 교체 시 코드 변경 최소화. PostgreSQL은 프로덕션 표준 |
| **트레이드오프** | SQLite는 동시 쓰기 제한 있음(단일 writer). 개발 전용으로만 사용하고 프로덕션 배포 전 PostgreSQL로 전환 필수 |

---

### 4. CSS 전략

| 항목 | 내용 |
|------|------|
| **선택** | Tailwind CSS 단독 사용 |
| **대안** | styled-components, CSS Modules, 일반 CSS |
| **근거** | 유틸리티 클래스로 디자인 토큰을 HTML에서 직접 확인 가능. Vanilla JS 환경에서 styled-components는 JS 런타임 의존으로 부적합 |
| **트레이드오프** | 클래스 문자열이 길어져 HTML 가독성 저하. 단, Tailwind 컨벤션을 알면 즉시 파악 가능 |
| **금지** | `styled-components` 사용 금지. CSS-in-JS는 이 프로젝트 구조와 맞지 않는다 |

---

### 5. 실시간 업데이트

| 항목 | 내용 |
|------|------|
| **선택** | 폴링 3초 간격 (MVP) |
| **대안** | WebSocket, SSE (Server-Sent Events) |
| **근거** | MVP 규모(10명 팀)에서 3초 폴링은 충분한 실시간성 제공. WebSocket은 서버 인프라·연결 관리 복잡도가 MVP 범위를 초과함 |
| **트레이드오프** | 폴링은 변경이 없어도 요청이 발생 → 서버 부하. 사용자 수 증가 시 WebSocket 전환 필요 |
| **확장 계획** | WebSocket 도입은 JWT 인증 완료 이후 확장 단계에서 진행 |

---

### 6. 프론트엔드 상태 관리

| 항목 | 내용 |
|------|------|
| **선택** | 모듈 변수 + DOM 직접 갱신 |
| **대안** | Redux, Zustand, Pinia, 전역 상태 라이브러리 |
| **근거** | 상태 범위가 단일 페이지의 Task 배열 하나. 라이브러리 도입 없이 `tasks` 배열을 모듈 스코프에 두고 변경 시 렌더 함수 호출로 충분 |
| **트레이드오프** | 상태-UI 동기화를 수동 관리. 화면이 복잡해질수록 추적 어려움. React 전환 시 상태 로직 재작성 필요 |

```js
// 상태 관리 패턴 예시
let tasks = [];

function renderTasks() { /* DOM 갱신 */ }

async function fetchTasks() {
  tasks = await api.getTasks();
  renderTasks();
}
```

---

### 7. 디자인 시스템

| 항목 | 내용 |
|------|------|
| **선택** | macOS UI 톤 자체 정의 |
| **대안** | Material Design, Ant Design |
| **근거** | 외부 디자인 시스템은 토큰 오버라이드 비용이 높고 번들 크기가 큼. macOS 톤은 Tailwind 유틸리티만으로 구현 가능 |
| **트레이드오프** | 컴포넌트를 직접 구현해야 함. 단, MVP 컴포넌트 수가 적어 실익이 비용보다 큼 |

**디자인 토큰 (Tailwind 클래스 기준)**

| 토큰 | Tailwind 클래스 | 용도 |
|------|----------------|------|
| 둥근 모서리 | `rounded-xl` | 카드, 버튼, 모달 |
| 그림자 | `shadow-lg` | 카드 elevation |
| 반투명 배경 | `backdrop-blur-sm` + `bg-white/80` | 카드, 네비게이션 |
| 시스템 폰트 | `font-sans` (`-apple-system, BlinkMacSystemFont, "Segoe UI"`) | 전체 |
| 터치 타깃 | `min-h-[44px] min-w-[44px]` | 버튼, 아이콘 버튼 전부 |

> **터치 타깃 44px 준수**: 모바일 360px 대응을 위해 모든 인터랙티브 요소에 적용. Apple HIG 기준.

---

### 8. 테마 (라이트 / 다크)

| 항목 | 내용 |
|------|------|
| **선택** | `dark:` Tailwind 변형 + `localStorage('theme')` 저장 |
| **대안** | CSS 변수만 사용, 시스템 설정 자동 추종 |
| **근거** | 사용자가 명시적으로 선택한 테마를 유지하는 것이 UX 우선. `localStorage` 로 새로고침 후에도 복원 |
| **트레이드오프** | `prefers-color-scheme` 초기값으로 사용하되, 이후 사용자 선택을 우선함. OS 테마 변경이 자동 반영되지 않음 |

**구현 규칙**

```js
// 초기화: localStorage 우선, 없으면 OS 설정 따름
const saved = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const theme = saved ?? (prefersDark ? 'dark' : 'light');
document.documentElement.classList.toggle('dark', theme === 'dark');

// 토글
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}
```

- `tailwind.config`의 `darkMode: 'class'` 설정 필수
- 모든 색상은 `text-gray-900 dark:text-gray-100` 형태로 라이트/다크 쌍으로 정의

---

## 의존성 추가 정책

> **이 문서에 사유가 기록되기 전까지 어떤 새 패키지도 도입할 수 없다.**

새 라이브러리·패키지·외부 서비스를 추가해야 할 경우:

1. 이 문서에 새 항목을 추가한다 (선택 / 대안 / 근거 / 트레이드오프 형식)
2. 사용자에게 승인을 요청한다
3. 승인 후 `requirements.txt` 또는 CDN 링크에 추가한다

이 절차를 건너뛰는 의존성 추가는 **절대 규칙 2번(돌발 의존성 금지)** 위반이다.
