import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import bcrypt
from dotenv import load_dotenv

from app.database.database import get_db
from app.database.models import UserDB
from app.models.user import UserRole
from app.schemas.user import (
    LoginResponse, RegisterRequest, UserPublic, UserUpdate,
    PasswordChangeRequest, ForgotPasswordRequest, ResetPasswordRequest
)

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "crimegpt-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8  # 8 hours
ACCESS_TOKEN_EXPIRE_REMEMBER = 60 * 24 * 30  # 30 days

bearer_scheme = HTTPBearer(auto_error=True)  # Explicitly require authentication

MAX_FAILED_ATTEMPTS = 5


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _create_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    payload = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload.update({"exp": expire})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def register_user(payload: RegisterRequest, db: Session) -> UserPublic:
    # Check if email already exists
    existing = db.query(UserDB).filter(UserDB.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered."
        )
    
    # Check if username already exists (if provided)
    if payload.username:
        existing_username = db.query(UserDB).filter(UserDB.username == payload.username.lower()).first()
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken."
            )
    
    # Create new user with pending status
    user = UserDB(
        id=str(uuid.uuid4()),
        full_name=payload.full_name,
        email=payload.email.lower(),
        username=payload.username.lower() if payload.username else None,
        password_hash=_hash_password(payload.password),
        role=payload.role,
        department=payload.department,
        phone=payload.phone,
        is_active=1,
        account_status="pending",  # Requires admin approval
        failed_login_attempts=0,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserPublic(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        username=user.username,
        role=user.role,
        department=user.department,
        phone=user.phone,
        profile_photo=user.profile_photo,
        is_active=bool(user.is_active),
        account_status=user.account_status,
        failed_login_attempts=user.failed_login_attempts,
        last_login=user.last_login,
        created_at=user.created_at,
    )


def login_user(email: str, password: str, db: Session, remember_me: bool = False) -> LoginResponse:
    # Find user
    user = db.query(UserDB).filter(UserDB.email == email.lower()).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Check if account is locked due to too many failed attempts
    # Auto-unlock after 30 minutes of last failed attempt
    if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
        # Check if we should auto-unlock (30 minutes since last failed login)
        if user.updated_at and (datetime.now(timezone.utc) - user.updated_at).total_seconds() > 1800:
            # Auto-unlock after 30 minutes
            user.failed_login_attempts = 0
            db.commit()
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account locked due to {MAX_FAILED_ATTEMPTS} failed login attempts. Try again in 30 minutes or contact administrator."
            )
    
    # Check if account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact administrator."
        )
    
    # Check account status
    if user.account_status == "pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is pending approval. Please wait for administrator approval."
        )
    
    if user.account_status == "rejected":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account registration was rejected. Please contact administrator."
        )
    
    if user.account_status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended. Please contact administrator."
        )
    
    # Verify password
    if not _verify_password(password, user.password_hash):
        # Increment failed attempts
        user.failed_login_attempts += 1
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Reset failed attempts and update last login
    user.failed_login_attempts = 0
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    
    # Log successful login activity
    try:
        from app.services.audit_service import AuditService
        AuditService.log_activity(
            db=db,
            user_id=user.id,
            action="Logged In",
            details="Authenticated successfully",
            activity_type="login"
        )
    except Exception as e:
        # Don't fail login if audit logging fails
        print(f"Audit logging failed: {e}")
    
    # Create token
    expire_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_REMEMBER if remember_me else ACCESS_TOKEN_EXPIRE_MINUTES)
    token = _create_token(
        {"sub": user.email, "role": user.role.value, "user_id": user.id},
        expires_delta=expire_delta
    )
    
    user_public = UserPublic(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        username=user.username,
        role=user.role,
        department=user.department,
        phone=user.phone,
        profile_photo=user.profile_photo,
        is_active=bool(user.is_active),
        account_status=user.account_status if hasattr(user, 'account_status') else "active",
        failed_login_attempts=user.failed_login_attempts if hasattr(user, 'failed_login_attempts') else 0,
        last_login=user.last_login,
        created_at=user.created_at,
    )
    
    return LoginResponse(
        access_token=token,
        role=user.role,
        user=user_public
    )


def _decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"}
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> UserPublic:
    payload = _decode_token(credentials.credentials)
    email: str = payload.get("sub")
    role: str = payload.get("role")
    user_id: str = payload.get("user_id")
    
    if not email or not role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload."
        )
    
    user = db.query(UserDB).filter(UserDB.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists."
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive."
        )
    
    # Check account status (allow active users only)
    if hasattr(user, 'account_status') and user.account_status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account access restricted. Please contact administrator."
        )
    
    return UserPublic(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        username=user.username,
        role=UserRole(role),
        department=user.department,
        phone=user.phone,
        profile_photo=user.profile_photo,
        is_active=bool(user.is_active),
        account_status=user.account_status if hasattr(user, 'account_status') else "active",
        failed_login_attempts=user.failed_login_attempts if hasattr(user, 'failed_login_attempts') else 0,
        last_login=user.last_login,
        created_at=user.created_at,
    )


def update_user_profile(user_id: str, payload: UserUpdate, db: Session) -> UserPublic:
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.username is not None:
        # Check if username is already taken by another user
        existing = db.query(UserDB).filter(
            UserDB.username == payload.username.lower(),
            UserDB.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken."
            )
        user.username = payload.username.lower()
    if payload.department is not None:
        user.department = payload.department
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.profile_photo is not None:
        user.profile_photo = payload.profile_photo
    
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    
    return UserPublic(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        username=user.username,
        role=user.role,
        department=user.department,
        phone=user.phone,
        profile_photo=user.profile_photo,
        is_active=bool(user.is_active),
        account_status=user.account_status if hasattr(user, 'account_status') else "active",
        failed_login_attempts=user.failed_login_attempts if hasattr(user, 'failed_login_attempts') else 0,
        last_login=user.last_login,
        created_at=user.created_at,
    )


def change_password(user_id: str, payload: PasswordChangeRequest, db: Session) -> dict:
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if not _verify_password(payload.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    
    user.password_hash = _hash_password(payload.new_password)
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    
    return {"message": "Password changed successfully"}


def forgot_password(payload: ForgotPasswordRequest, db: Session) -> dict:
    """
    Placeholder for forgot password functionality.
    In production, this would send a password reset email with a token.
    """
    user = db.query(UserDB).filter(UserDB.email == payload.email.lower()).first()
    
    # Always return success to prevent email enumeration
    return {
        "message": "If an account with this email exists, a password reset link has been sent.",
        "note": "Email service not configured. Please contact administrator for password reset."
    }


def reset_password(payload: ResetPasswordRequest, db: Session) -> dict:
    """
    Placeholder for reset password functionality.
    In production, this would verify the reset token and update the password.
    """
    # Decode and verify reset token
    try:
        token_data = _decode_token(payload.token)
        email = token_data.get("sub")
        reset_purpose = token_data.get("purpose")
        
        if reset_purpose != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset token"
            )
        
        user = db.query(UserDB).filter(UserDB.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user.password_hash = _hash_password(payload.new_password)
        user.failed_login_attempts = 0
        user.updated_at = datetime.now(timezone.utc)
        db.commit()
        
        return {"message": "Password reset successfully"}
    
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )


def require_roles(*roles: UserRole):
    def _check(current_user: UserPublic = Depends(get_current_user)) -> UserPublic:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required: {[r.value for r in roles]}"
            )
        return current_user
    return _check
