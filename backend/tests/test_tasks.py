import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.database import Base, get_db

# StaticPool: 모든 연결이 같은 인메모리 DB를 공유 (테이블 유실 방지)
TEST_DATABASE_URL = "sqlite://"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


# ── POST /api/tasks ──────────────────────────────────────────────────────────

def test_create_task_success():
    res = client.post("/api/tasks", json={"title": "테스트 업무"})
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "테스트 업무"
    assert data["status"] == "todo"
    assert "id" in data
    assert "description" in data


def test_create_task_with_all_fields():
    payload = {
        "title": "전체 필드 업무",
        "description": "상세 설명",
        "status": "in_progress",
        "due_at": "2026-05-12T18:00:00Z",
    }
    res = client.post("/api/tasks", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["description"] == "상세 설명"
    assert data["status"] == "in_progress"


def test_create_task_missing_title_returns_400():
    res = client.post("/api/tasks", json={"status": "todo"})
    assert res.status_code == 422


def test_create_task_blank_title_returns_400():
    res = client.post("/api/tasks", json={"title": "   "})
    assert res.status_code == 422


def test_create_task_title_too_long_returns_400():
    res = client.post("/api/tasks", json={"title": "x" * 201})
    assert res.status_code == 422


def test_create_task_invalid_status_returns_400():
    res = client.post("/api/tasks", json={"title": "업무", "status": "invalid_status"})
    assert res.status_code == 422


# ── GET /api/tasks ───────────────────────────────────────────────────────────

def test_list_tasks_empty():
    res = client.get("/api/tasks")
    assert res.status_code == 200
    assert res.json() == []


def test_list_tasks_excludes_description():
    client.post("/api/tasks", json={"title": "업무1", "description": "숨겨야 할 설명"})
    res = client.get("/api/tasks")
    assert res.status_code == 200
    assert "description" not in res.json()[0]


def test_list_tasks_filter_by_status():
    client.post("/api/tasks", json={"title": "할 일", "status": "todo"})
    client.post("/api/tasks", json={"title": "진행 중", "status": "in_progress"})
    res = client.get("/api/tasks?status_filter=todo")
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 1
    assert items[0]["status"] == "todo"


# ── GET /api/tasks/{id} ──────────────────────────────────────────────────────

def test_get_task_success():
    created = client.post("/api/tasks", json={"title": "단건 조회", "description": "설명 포함"}).json()
    res = client.get(f"/api/tasks/{created['id']}")
    assert res.status_code == 200
    data = res.json()
    assert data["description"] == "설명 포함"


def test_get_task_not_found_returns_404():
    res = client.get("/api/tasks/9999")
    assert res.status_code == 404


# ── PUT /api/tasks/{id} ──────────────────────────────────────────────────────

def test_update_task_partial():
    created = client.post("/api/tasks", json={"title": "원래 제목"}).json()
    res = client.put(f"/api/tasks/{created['id']}", json={"status": "in_progress"})
    assert res.status_code == 200
    assert res.json()["status"] == "in_progress"
    assert res.json()["title"] == "원래 제목"


def test_update_task_not_found_returns_404():
    res = client.put("/api/tasks/9999", json={"status": "done"})
    assert res.status_code == 404


def test_update_task_invalid_status_returns_400():
    created = client.post("/api/tasks", json={"title": "업무"}).json()
    res = client.put(f"/api/tasks/{created['id']}", json={"status": "wrong"})
    assert res.status_code == 422


# ── DELETE /api/tasks/{id} ───────────────────────────────────────────────────

def test_delete_task_success():
    created = client.post("/api/tasks", json={"title": "삭제할 업무"}).json()
    res = client.delete(f"/api/tasks/{created['id']}")
    assert res.status_code == 204


def test_delete_task_not_found_returns_404():
    res = client.delete("/api/tasks/9999")
    assert res.status_code == 404


def test_delete_task_then_get_returns_404():
    created = client.post("/api/tasks", json={"title": "삭제 후 조회"}).json()
    client.delete(f"/api/tasks/{created['id']}")
    res = client.get(f"/api/tasks/{created['id']}")
    assert res.status_code == 404
