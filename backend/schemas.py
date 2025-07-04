from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "staff"
    permissions: Optional[Dict[str, bool]] = {
        "canAddClients": True,
        "canEditClients": True,
        "canDeleteClients": False,
        "canViewReports": True,
        "canExportData": False
    }

class UserOut(UserBase):
    id: int
    role: str
    status: Optional[str] = "active"
    last_login: Optional[datetime] = None
    created_at: Optional[datetime] = None
    permissions: Optional[Dict[str, bool]] = None

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    status: Optional[str] = None
    permissions: Optional[Dict[str, bool]] = None

class RoleUpdate(BaseModel):
    role: str

class ClientBase(BaseModel):
    name: str
    phone: str
    note: str = ""
    status: Optional[str] = "новый"

class ClientCreate(ClientBase):
    pass

class ClientOut(ClientBase):
    id: int
    created_at: Optional[datetime] = None
    owner_id: Optional[int] = None

    class Config:
        from_attributes = True

class StaffStats(BaseModel):
    total: int
    active: int
    admins: int
    managers: int
    staff: int

class SubscriptionInfo(BaseModel):
    plan: str
    status: str
    expires_at: str
    max_users: int
    current_users: int
    features: list[str]

class PermissionUpdate(BaseModel):
    permissions: Dict[str, bool]

# Схемы для уведомлений
class NotificationCreate(BaseModel):
    user_id: int
    type: str
    message: str
    details: Optional[str] = None

class NotificationOut(BaseModel):
    id: int
    type: str
    message: str
    details: Optional[str] = None
    created_at: datetime
    read: bool = False

    class Config:
        from_attributes = True