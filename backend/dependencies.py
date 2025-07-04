from fastapi import Depends
from sqlalchemy.orm import Session
from . import database, auth, models

def get_db():
    """Получить сессию базы данных"""
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    token: str = Depends(auth.oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    """Получить текущего пользователя"""
    return auth.get_current_user(token, db)

def get_current_active_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """Получить активного пользователя"""
    return auth.get_current_active_user(current_user)