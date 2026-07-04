from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    username: Optional[str] = None
    password: str
    role: UserRole = UserRole.investigator
    department: Optional[str] = None
    phone: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "full_name": "Inspector Rajesh Kumar",
                "email": "rajesh@cybercrime.gov.in",
                "username": "rajesh.kumar",
                "password": "StrongPassword123",
                "role": "investigator",
                "department": "Cyber Crime Cell",
                "phone": "+91-9876543210"
            }
        }
    }


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: Optional[bool] = False

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "rajesh@cybercrime.gov.in",
                "password": "StrongPassword123",
                "remember_me": False
            }
        }
    }


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user: "UserPublic"


class UserPublic(BaseModel):
    id: str
    full_name: str
    email: str
    username: Optional[str] = None
    role: UserRole
    department: Optional[str] = None
    phone: Optional[str] = None
    profile_photo: Optional[str] = None
    is_active: bool
    account_status: Optional[str] = "active"
    failed_login_attempts: Optional[int] = 0
    last_login: Optional[datetime] = None
    created_at: datetime


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    profile_photo: Optional[str] = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
