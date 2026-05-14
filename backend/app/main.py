from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import tasks

# 서버 시작 시 테이블 자동 생성
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TaskFlow2 API",
    description="팀 업무 관리 풀스택 웹앱 API",
    version="1.0.0",
)

# 프론트엔드(file:// 또는 localhost)와 통신하기 위한 CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
