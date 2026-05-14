# 05-conventions.md — 협업 규칙

## 네이밍 컨벤션

| 대상 | 규칙 | 예시 |
|------|------|------|
| 백엔드 변수·함수·파일 | `snake_case` | `get_task_by_id`, `due_at`, `task_router.py` |
| 프론트엔드 변수·함수 | `camelCase` | `fetchTasks`, `dueAt`, `renderTaskCard` |
| 컴포넌트·클래스 | `PascalCase` | `TaskCard`, `ModalDialog`, `ApiClient` |
| 상수 | `UPPER_SNAKE_CASE` | `API_BASE_URL`, `POLL_INTERVAL_MS` |
| CSS 클래스 | Tailwind 유틸리티 그대로 | `rounded-xl`, `dark:bg-gray-800` |

> **식별자는 반드시 영어로 작성한다.**
> **주석은 한국어로 작성한다.** 코드가 말하지 못하는 '왜'만 적는다.

---

## 금지 사항

| 금지 | 이유 | 대안 |
|------|------|------|
| `print()` 디버깅 | 운영 환경 로그 오염, 제거를 잊으면 노이즈 | `logging` 모듈 사용 (`logger.debug`, `logger.info`) |
| `bare except` (`except:`) | 모든 예외를 삼켜 원인 파악 불가 | `except SpecificError as e:` 로 예외 명시 |
| 비밀번호·키 하드코딩 | 코드 유출 시 즉시 보안 사고 | `.env` 파일 + `os.getenv()` 사용, `.gitignore` 등록 필수 |
| `any` 타입 (TypeScript 확장 시) | 타입 시스템 의미 상실, 런타임 오류 추적 불가 | 명시적 타입 또는 `unknown` + 타입 가드 사용 |
| `!important` (CSS) | 우선순위 꼬임으로 유지보수 불가 | 셀렉터 구체성 개선 또는 Tailwind 유틸리티 순서 조정 |

---

## 폴더 구조

```
taskflow2/
├── CLAUDE.md
├── docs/
│   ├── 00-overview.md
│   ├── 01-product.md
│   ├── 02-specs.md
│   ├── 03-design.md
│   ├── 04-tasks.md
│   └── 05-conventions.md
├── backend/
│   ├── .venv/                  # 가상환경 (git 제외)
│   ├── app/
│   │   ├── main.py             # FastAPI 앱 진입점
│   │   ├── models.py           # SQLAlchemy 모델
│   │   ├── schemas.py          # Pydantic 스키마
│   │   ├── database.py         # DB 연결 설정
│   │   └── routers/
│   │       └── tasks.py        # /api/tasks 라우터
│   ├── tests/
│   │   └── test_tasks.py       # pytest 테스트
│   ├── requirements.txt
│   └── .env                    # 환경 변수 (git 제외)
└── frontend/
    ├── index.html              # 단일 페이지
    ├── app.js                  # 메인 JS (상태·렌더·이벤트)
    ├── api.js                  # API 호출 모듈
    └── style.css               # Tailwind 커스텀 (최소화)
```

> 이 구조를 무단으로 변경하지 않는다. 변경이 필요하면 사유를 설명하고 승인을 받는다. (`03-design.md` 의존성 정책 참고)

---

## 테스트 규칙

**도구**: `pytest`

**필수 케이스**: 모든 API 엔드포인트에 대해 아래 3가지를 반드시 작성한다.

| 케이스 | 예시 |
|--------|------|
| 정상 동작 | `POST /api/tasks` → 201, 생성된 Task 반환 |
| 404 케이스 | `GET /api/tasks/9999` → 404 |
| 400 케이스 | `POST /api/tasks` (title 누락) → 400 |

**실행 방법**

```bash
cd backend
pytest tests/ -v
```

**커버리지 기준**: CRUD 5개 엔드포인트 × 3케이스 = 최소 15개 테스트 통과.
테스트 없이 구현 완료로 간주하지 않는다. (절대 규칙 3번)

---

## Git 커밋 컨벤션

### 타입 목록

| 타입 | 용도 | 예시 |
|------|------|------|
| `feat` | 새 기능 추가 | `feat: 업무 추가 폼 구현` |
| `fix` | 버그 수정 | `fix: due_at 없을 때 카드 렌더 오류 수정` |
| `docs` | 문서 작성·수정 | `docs: Phase 1 설계문서 7종 작성` |
| `refactor` | 기능 변경 없는 코드 개선 | `refactor: fetchTasks 함수 분리` |
| `test` | 테스트 추가·수정 | `test: DELETE 404 케이스 추가` |
| `chore` | 빌드·설정·의존성 | `chore: requirements.txt 업데이트` |

### 커밋 메시지 규칙

```
<타입>: <한국어 요약> (50자 이내)

# 예시
feat: 업무 목록 카드에 D-N HH:MM 표시 추가
fix: 삭제 버튼 클릭 시 수정 모달 열리는 버그 수정
docs: Phase 1 설계문서 7종 작성
```

- 제목은 **한국어**로 작성한다
- 본문이 필요한 경우 빈 줄 후 추가 설명
- WIP 커밋은 `chore: WIP - <작업명>` 형식 사용
