from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, database, auth

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/clients", response_model=schemas.ClientOut)
def create_client(
    client: schemas.ClientCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """Создать нового клиента"""
    db_client = models.Client(**client.dict(), owner_id=current_user.id)
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

@router.get("/clients", response_model=list[schemas.ClientOut])
def get_clients(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """Получить список клиентов текущего пользователя"""
    return db.query(models.Client).filter(models.Client.owner_id == current_user.id).all()

@router.delete("/clients/{client_id}")
def delete_client(
    client_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """Удалить клиента"""
    client = db.query(models.Client).filter(
        models.Client.id == client_id,
        models.Client.owner_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    
    db.delete(client)
    db.commit()
    return {"message": "Клиент удалён"}

@router.put("/clients/{client_id}", response_model=schemas.ClientOut)
def update_client(
    client_id: int, 
    updated_data: schemas.ClientCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """Обновить данные клиента"""
    client = db.query(models.Client).filter(
        models.Client.id == client_id,
        models.Client.owner_id == current_user.id
    ).first()

    if not client:
        raise HTTPException(status_code=404, detail="Клиент не найден")

    for field, value in updated_data.dict().items():
        setattr(client, field, value)

    db.commit()
    db.refresh(client)
    return client