from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import auth, clients, admin_routes
from .database import engine
from . import models

# �������� ������
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="BusinessCRM API", version="1.0.0")

# ������������ ��������� CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://localhost:5173",
        "https://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "accept",
        "accept-encoding",
        "authorization",
        "content-type",
        "dnt",
        "origin",
        "user-agent",
        "x-csrftoken",
        "x-requested-with",
    ],
    expose_headers=["*"]
)

# ��������
app.include_router(auth.router)
app.include_router(clients.router)
app.include_router(admin_routes.router, tags=["admin"])

@app.get("/")
def read_root():
    return {"message": "BusinessCRM API"}

# �������������� ���������� ��� OPTIONS ��������
@app.options("/{path:path}")
def options_handler(path: str):
    return {"message": "OK"}