from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    hashed_password = Column(String)
    role = Column(String, default="staff")  # staff, admin, manager
    status = Column(String, default="active")  # active, inactive, suspended
    permissions = Column(JSON, default={
        "canAddClients": True,
        "canEditClients": True,
        "canDeleteClients": False,
        "canViewReports": True,
        "canExportData": False
    })
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Связи
    clients = relationship("Client", back_populates="owner")
    notifications = relationship("Notification", back_populates="user")
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = relationship("User", remote_side=[id])

class Client(Base):
    __tablename__ = "clients"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String)
    note = Column(Text)
    status = Column(String, default="новый")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Связи
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="clients")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String)  # success, error, warning, info
    message = Column(String)
    details = Column(Text, nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    
    # Связи
    user = relationship("User", back_populates="notifications")

class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    subscription_plan = Column(String, default="basic")  # basic, professional, enterprise
    subscription_status = Column(String, default="active")  # active, suspended, expired
    subscription_expires_at = Column(DateTime)
    max_users = Column(Integer, default=5)
    created_at = Column(DateTime, default=func.now())
    
    # Настройки организации
    settings = Column(JSON, default={
        "allowExport": True,
        "allowDelete": False,
        "requireApproval": False
    })

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)  # create, update, delete, login, logout
    target_type = Column(String)  # client, user, organization
    target_id = Column(Integer, nullable=True)
    description = Column(String)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())
    
    # Связи
    user = relationship("User")

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    plan = Column(String)  # basic, professional, enterprise
    status = Column(String)  # active, suspended, expired, cancelled
    starts_at = Column(DateTime)
    expires_at = Column(DateTime)
    max_users = Column(Integer)
    price = Column(Integer)  # цена в копейках
    created_at = Column(DateTime, default=func.now())
    
    # Связи
    organization = relationship("Organization")