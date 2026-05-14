# 04-tasks.md — MVP 구현 계획

## 진행 규칙

> - **순서대로만 진행한다.** 이전 단계 검증이 통과되지 않으면 다음 단계로 넘어가지 않는다.
> - **병렬 작업 금지.** 두 단계를 동시에 진행하지 않는다.
> - **단계별 검증 필수.** 검증 방법을 실제로 실행하여 통과 확인 후 체크한다.
> - **확장 단계는 이 문서에 포함하지 않는다.** 별도 문서에서 다룬다.

---

## Phase 1 — 설계 문서 작성 ✅ 완료

**목표**: AI 협업 기준 문서와 프로젝트 설계 문서 전체를 완성한다.

| # | 작업 | 상태 | 검증 방법 |
|---|------|------|-----------|
| 1-01 | `CLAUDE.md` 작성 (역할·절대 규칙·모호한 요청 처리) | ✅ | 파일 존재 + 5개 절대 규칙 항목 확인 |
| 1-02 | `docs/` 폴더 생성 | ✅ | 디렉토리 존재 확인 |
| 1-03 | `docs/00-overview.md` 작성 (매핑표·읽는 순서·관심사 분리) | ✅ | 6개 파일 매핑표 포함 여부 확인 |
| 1-04 | `docs/01-product.md` 작성 (목표·페르소나·MVP 범위·성공 기준) | ✅ | 성공 기준 5개 항목 포함 여부 확인 |
| 1-05 | `docs/02-specs.md` 작성 (데이터 모델·검증·API 5개·화면 명세) | ✅ | REST API 5개 엔드포인트 명세 포함 여부 확인 |
| 1-06 | `docs/03-design.md` 작성 (기술 결정 8선·의존성 정책) | ✅ | 결정 항목 8개 + 의존성 추가 정책 포함 여부 확인 |
| 1-07 | `docs/04-tasks.md` 작성 (현재 문서, Phase 1~3 체크리스트) | ✅ | Phase별 체크리스트 존재 확인 |
| 1-08 | `docs/05-conventions.md` 작성 (폴더 구조·네이밍·커밋 컨벤션) | ✅ | 폴더 트리 + 커밋 타입 목록 포함 여부 확인 |
| 1-09 | git 초기화 + 원격 저장소 연결 | ✅ | `git remote -v` 로 origin 확인 |
| 1-10 | 설계 문서 전체 git commit & push | ✅ | GitHub 저장소에 `docs/` 폴더 반영 확인 |

---

## Phase 2 — 백엔드 구현 ✅ 완료

**목표**: FastAPI로 Task CRUD API 5개를 구현하고 Swagger UI에서 전부 동작을 확인한다.

| # | 작업 | 상태 | 검증 방법 |
|---|------|------|-----------|
| 2-01 | `backend/` 폴더 생성 + Python 가상환경 구성 | ✅ | `python -m venv .venv` 실행 후 활성화 확인 |
| 2-02 | `requirements.txt` 작성 (fastapi, uvicorn, sqlalchemy, pydantic 등) | ✅ | `pip install -r requirements.txt` 오류 없이 완료 |
| 2-03 | SQLAlchemy 모델 정의 (`Task`: id, title, description, status, due_at, created_at, updated_at) | ✅ | `python -c "from app.models import Task"` 오류 없음 |
| 2-04 | SQLite DB 연결 + 테이블 자동 생성 | ✅ | 서버 최초 실행 시 `taskflow.db` 파일 생성 확인 |
| 2-05 | Pydantic 스키마 정의 (TaskCreate, TaskUpdate, TaskResponse, TaskListItem) | ✅ | 스키마 import 오류 없음, 목록/단건 `description` 포함 여부 차이 확인 |
| 2-06 | `POST /api/tasks` 구현 (201, 검증 400) | ✅ | Swagger UI에서 정상 title → 201, 빈 title → 400 확인 |
| 2-07 | `GET /api/tasks` 구현 (200, status 필터, description 제외) | ✅ | Swagger UI에서 목록 반환 + 응답에 `description` 없음 확인 |
| 2-08 | `GET /api/tasks/{id}` 구현 (200, 404, description 포함) | ✅ | 존재하는 id → 200 + `description` 포함, 없는 id → 404 확인 |
| 2-09 | `PUT /api/tasks/{id}` 구현 (200, 부분 수정, 400, 404) | ✅ | status만 변경 요청 → 200, 없는 id → 404, 잘못된 status → 400 확인 |
| 2-10 | `DELETE /api/tasks/{id}` 구현 (204, 404) + API 전체 응답시간 확인 | ✅ | 삭제 후 204, 재삭제 시 404, 네트워크 탭에서 CRUD 5종 모두 200ms 이하 확인 |

---

## Phase 3 — 프론트엔드 구현 ✅ 완료

**목표**: Vanilla JS + Tailwind CSS로 메인 화면을 구현하고 백엔드 API와 연결 후 GitHub에 push한다.

| # | 작업 | 상태 | 검증 방법 |
|---|------|------|-----------|
| 3-01 | `frontend/` 폴더 생성 + `index.html` 기본 구조 (Tailwind CDN, 시스템 폰트, dark 클래스 준비) | ✅ | 브라우저에서 열었을 때 빈 화면 오류 없음, 콘솔 에러 없음 |
| 3-02 | 테마 토글 구현 (`localStorage('theme')`, `prefers-color-scheme` 초기값, `dark:` 변형 적용) | ✅ | 토글 클릭 → 테마 전환, 새로고침 후 테마 유지 확인 |
| 3-03 | 업무 추가 폼 구현 (title, due_at, status 입력 → `POST /api/tasks`) | ✅ | 폼 제출 → 네트워크 탭에서 201 응답 확인 |
| 3-04 | 업무 목록 렌더링 구현 (카드, status 배지, D-N HH:MM 표시, 3초 폴링) | ✅ | 목록 카드 렌더링 확인, 3초마다 `GET /api/tasks` 요청 확인 |
| 3-05 | 수정 모달 구현 (카드 클릭 → `GET /api/tasks/{id}` → 모달, 저장 → `PUT`) | ✅ | 카드 클릭 시 모달 열림, description 표시, 저장 후 목록 갱신 확인 |
| 3-06 | 삭제 구현 (🗑 클릭 → 확인 다이얼로그 → `DELETE`, stopPropagation 처리) | ✅ | 삭제 클릭 시 다이얼로그 표시, 확인 후 카드 제거, 모달 열리지 않음 확인 |
| 3-07 | 반응형 검증 (360px 레이아웃 깨짐 없음, 터치 타깃 44px 준수) | ✅ | DevTools 360px 뷰포트에서 전체 화면 확인, 버튼 높이 44px 이상 확인 |
| 3-08 | 성공 기준 5개 전체 통과 확인 후 git commit & push | ✅ | 아래 성공 기준 체크리스트 전부 ✅ 후 push |

---

## 최종 성공 기준 체크리스트

> Phase 3-08 진행 전 아래 5개를 전부 통과해야 한다.

| 기준 | 확인 방법 | 통과 |
|------|-----------|------|
| 새로고침 후 테마 유지 | 테마 변경 → 새로고침 → 동일 테마 표시 | ✅ |
| 360px 레이아웃 깨짐 없음 | DevTools 360px 뷰포트 전체 스크롤 확인 | ✅ |
| API 응답 200ms 이하 (CRUD 5종) | 네트워크 탭 각 요청 Duration 확인 | ✅ |
| CRUD 4종 화면 동작 | 추가 → 수정 → 삭제 → 목록 시나리오 통과 | ✅ |
| 테마 토글 전체 UI 적용 | 라이트 ↔ 다크 전환 시 모든 요소 색상 변경 확인 | ✅ |
