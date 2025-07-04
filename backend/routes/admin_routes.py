from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database
from ..auth import get_current_user, get_password_hash
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["admin"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def require_admin(current_user: models.User = Depends(get_current_user)):
    """Проверка админских прав"""
    if current_user.role not in ["admin", "owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав доступа"
        )
    return current_user

@router.get("/staff", response_model=List[schemas.UserOut])
async def get_staff(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Получить список всех сотрудников"""
    staff = db.query(models.User).all()
    
    # Исправляем permissions для каждого пользователя
    for user in staff:
        if user.permissions is None or isinstance(user.permissions, list):
            user.permissions = {
                "canAddClients": True,
                "canEditClients": True,
                "canDeleteClients": False,
                "canViewReports": True,
                "canExportData": False
            }
    
    return staff

@router.post("/staff", response_model=schemas.UserOut)
async def create_staff(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Создать нового сотрудника"""
    # Проверяем, что email уникален
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует"
        )
    
    # Создаем пользователя
    hashed_password = get_password_hash(user.password)
    
    # Убеждаемся, что permissions - это словарь
    permissions = user.permissions if user.permissions else {
        "canAddClients": True,
        "canEditClients": True,
        "canDeleteClients": False,
        "canViewReports": True,
        "canExportData": False
    }
    
    db_user = models.User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password,
        role=user.role if hasattr(user, 'role') else "staff",
        permissions=permissions,
        created_by_id=current_user.id if hasattr(models.User, 'created_by_id') else None
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Логируем действие
    log_activity(
        db=db,
        user_id=current_user.id,
        action="create",
        target_type="user",
        target_id=db_user.id,
        description=f"Создан новый сотрудник: {db_user.name} ({db_user.email})"
    )
    
    return db_user

@router.put("/staff/{staff_id}/role")
async def update_staff_role(
    staff_id: int,
    role_data: dict,  # Временно используем dict вместо schemas.RoleUpdate
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Изменить роль сотрудника"""
    staff = db.query(models.User).filter(models.User.id == staff_id).first()
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сотрудник не найден"
        )
    
    # Нельзя изменить роль самого себя
    if staff.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя изменить собственную роль"
        )
    
    old_role = staff.role
    staff.role = role_data.get("role", staff.role)
    if hasattr(staff, 'updated_at'):
        staff.updated_at = datetime.utcnow()
    
    db.commit()
    
    # Логируем действие
    log_activity(
        db=db,
        user_id=current_user.id,
        action="update",
        target_type="user",
        target_id=staff.id,
        description=f"Изменена роль сотрудника {staff.name}: {old_role} → {staff.role}"
    )
    
    return {"message": "Роль успешно изменена"}

@router.delete("/staff/{staff_id}")
async def delete_staff(
    staff_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Удалить сотрудника"""
    staff = db.query(models.User).filter(models.User.id == staff_id).first()
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сотрудник не найден"
        )
    
    # Нельзя удалить самого себя
    if staff.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя удалить самого себя"
        )
    
    # Переназначаем клиентов удаляемого сотрудника на администратора
    if hasattr(models, 'Client'):
        clients_to_reassign = db.query(models.Client).filter(models.Client.owner_id == staff_id).all()
        for client in clients_to_reassign:
            client.owner_id = current_user.id
    
    staff_name = staff.name
    db.delete(staff)
    db.commit()
    
    # Логируем действие
    log_activity(
        db=db,
        user_id=current_user.id,
        action="delete",
        target_type="user",
        target_id=staff_id,
        description=f"Удален сотрудник: {staff_name}. Клиенты переназначены на {current_user.name}"
    )
    
    return {"message": "Сотрудник успешно удален"}

@router.put("/staff/{staff_id}/permissions")
async def update_staff_permissions(
    staff_id: int,
    permissions_data: dict,  # Временно используем dict
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Обновить права доступа сотрудника"""
    staff = db.query(models.User).filter(models.User.id == staff_id).first()
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сотрудник не найден"
        )
    
    # Убеждаемся, что permissions - это словарь
    new_permissions = permissions_data.get("permissions", {})
    if not isinstance(new_permissions, dict):
        new_permissions = {
            "canAddClients": True,
            "canEditClients": True,
            "canDeleteClients": False,
            "canViewReports": True,
            "canExportData": False
        }
    
    if hasattr(staff, 'permissions'):
        staff.permissions = new_permissions
    if hasattr(staff, 'updated_at'):
        staff.updated_at = datetime.utcnow()
    
    db.commit()
    
    # Логируем действие
    log_activity(
        db=db,
        user_id=current_user.id,
        action="update",
        target_type="user",
        target_id=staff.id,
        description=f"Обновлены права доступа для сотрудника: {staff.name}"
    )
    
    return {"message": "Права доступа обновлены"}

@router.get("/stats")
async def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Получить статистику для админ-панели"""
    total_users = db.query(models.User).count()
    active_users = db.query(models.User).filter(models.User.status == "active").count() if hasattr(models.User, 'status') else total_users
    
    # Статистика по ролям
    admins = db.query(models.User).filter(models.User.role == "admin").count()
    managers = db.query(models.User).filter(models.User.role == "manager").count()
    staff = db.query(models.User).filter(models.User.role == "staff").count()
    
    total_clients = 0
    if hasattr(models, 'Client'):
        total_clients = db.query(models.Client).count()
    
    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "admins": admins,
            "managers": managers,
            "staff": staff
        },
        "clients": {
            "total": total_clients
        }
    }

@router.get("/subscription")
async def get_subscription_info(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Получить информацию о подписке"""
    # Это заглушка - в реальном приложении данные будут браться из базы
    return {
        "plan": "professional",
        "status": "active",
        "expires_at": "2024-12-31",
        "max_users": 25,
        "current_users": db.query(models.User).count(),
        "features": [
            "Неограниченное количество клиентов",
            "Расширенная аналитика",
            "Экспорт данных",
            "Приоритетная поддержка"
        ]
    }

@router.get("/activity-log")
async def get_activity_log(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Получить журнал активности"""
    logs = []
    if hasattr(models, 'ActivityLog'):
        logs = db.query(models.ActivityLog).order_by(
            models.ActivityLog.created_at.desc()
        ).limit(limit).all()
    
    return logs

def log_activity(
    db: Session,
    user_id: int,
    action: str,
    target_type: str,
    target_id: int,
    description: str,
    ip_address: str = None,
    user_agent: str = None
):
    """Логирование действий пользователей"""
    if hasattr(models, 'ActivityLog'):
        log = models.ActivityLog(
            user_id=user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            description=description,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(log)
        db.commit()

# Функция для создания первого администратора
@router.post("/initialize", response_model=schemas.UserOut)
async def initialize_admin(
    admin_data: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    """Создать первого администратора (только если нет других пользователей)"""
    if db.query(models.User).count() > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Система уже инициализирована"
        )
    
    hashed_password = get_password_hash(admin_data.password)
    
    # Убеждаемся, что permissions - это словарь
    permissions = {
        "canAddClients": True,
        "canEditClients": True,
        "canDeleteClients": True,
        "canViewReports": True,
        "canExportData": True
    }
    
    admin_user = models.User(
        email=admin_data.email,
        name=admin_data.name,
        hashed_password=hashed_password,
        role="admin",
        permissions=permissions
    )
    
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    
    return admin_user