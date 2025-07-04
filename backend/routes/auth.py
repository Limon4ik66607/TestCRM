from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .. import database, models, schemas, auth

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = auth.hash_password(user.password)
    
    # Убеждаемся, что permissions - это словарь
    permissions = user.permissions if user.permissions else {
        "canAddClients": True,
        "canEditClients": True,
        "canDeleteClients": True,
        "canViewReports": True,
        "canExportData": True
    }
    
    new_user = models.User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password,
        role="admin",  # По умолчанию создаём владельца
        permissions=permissions
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not db_user or not auth.verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")

    token = auth.create_access_token({"sub": db_user.email})
    return {"access_token": token, "token_type": "bearer"}

# Маршрут для получения информации о текущем пользователе
@router.get("/users/me", response_model=schemas.UserOut)
def get_current_user_info(
    current_user: models.User = Depends(auth.get_current_user)
):
    """Получить информацию о текущем пользователе"""
    # Исправляем permissions, если они некорректны
    if current_user.permissions is None or isinstance(current_user.permissions, list):
        current_user.permissions = {
            "canAddClients": True,
            "canEditClients": True,
            "canDeleteClients": False,
            "canViewReports": True,
            "canExportData": False
        }
    
    return current_user