"""
User Management API

Admin-only endpoints for managing users in the system.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.database.database import get_db
from app.database.models import UserDB
from app.models.user import UserRole
from app.schemas.user import UserPublic, UserUpdate
from app.services.auth_service import get_current_user, require_roles, _hash_password
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/users", tags=["User Management"])


class UserListResponse(BaseModel):
    users: List[UserPublic]
    total: int
    page: int
    per_page: int
    total_pages: int


class UserCreateRequest(BaseModel):
    full_name: str
    email: EmailStr
    username: Optional[str] = None
    password: str
    role: UserRole
    department: Optional[str] = None
    phone: Optional[str] = None


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    role: Optional[UserRole] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    profile_photo: Optional[str] = None


class PasswordResetRequest(BaseModel):
    new_password: str


@router.get("", response_model=UserListResponse,
            summary="List all users (Admin only)")
def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
    sort_by: str = Query("created_at", regex="^(created_at|full_name|email|last_login)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_user: UserPublic = Depends(require_roles(UserRole.admin)),
    db: Session = Depends(get_db)
):
    """
    Get paginated list of all users with optional filtering.
    
    Only accessible by Admin users.
    """
    query = db.query(UserDB)
    
    # Apply filters
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                UserDB.full_name.ilike(search_term),
                UserDB.email.ilike(search_term),
                UserDB.username.ilike(search_term),
                UserDB.department.ilike(search_term)
            )
        )
    
    if role:
        query = query.filter(UserDB.role == role)
    
    if is_active is not None:
        query = query.filter(UserDB.is_active == (1 if is_active else 0))
    
    # Count total
    total = query.count()
    
    # Apply sorting
    sort_column = getattr(UserDB, sort_by)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Apply pagination
    offset = (page - 1) * per_page
    users = query.offset(offset).limit(per_page).all()
    
    total_pages = (total + per_page - 1) // per_page
    
    return UserListResponse(
        users=[
            UserPublic(
                id=u.id,
                full_name=u.full_name,
                email=u.email,
                username=u.username,
                role=u.role,
                department=u.department,
                phone=u.phone,
                profile_photo=u.profile_photo,
                is_active=bool(u.is_active),
                account_status=u.account_status if hasattr(u, 'account_status') else "active",
                failed_login_attempts=u.failed_login_attempts if hasattr(u, 'failed_login_attempts') else 0,
                last_login=u.last_login,
                created_at=u.created_at
            )
            for u in users
        ],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )


@router.get("/investigators", response_model=List[UserPublic],
            summary="Get all active investigators")
def list_investigators(
    current_user: UserPublic = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of active investigators for case assignment.
    
    Accessible by Admin and Investigators.
    """
    investigators = db.query(UserDB).filter(
        UserDB.role == UserRole.investigator,
        UserDB.is_active == 1
    ).order_by(UserDB.full_name.asc()).all()
    
    return [
        UserPublic(
            id=u.id,
            full_name=u.full_name,
            email=u.email,
            username=u.username,
            role=u.role,
            department=u.department,
            phone=u.phone,
            profile_photo=u.profile_photo,
            is_active=bool(u.is_active),
            account_status=u.account_status if hasattr(u, 'account_status') else "active",
            failed_login_attempts=u.failed_login_attempts if hasattr(u, 'failed_login_attempts') else 0,
            last_login=u.last_login,
            created_at=u.created_at
        )
        for u in investigators
    ]


@router.get("/{user_id}", response_model=UserPublic,
            summary="Get user by ID (Admin only)")
def get_user(
    user_id: str,
    current_user: UserPublic = Depends(require_roles(UserRole.admin)),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific user.
    
    Only accessible by Admin users.
    """
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
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
        created_at=user.created_at
    )


@router.post("", response_model=UserPublic, status_code=status.HTTP_201_CREATED,
             summary="Create new user (Admin only)")
def create_user(
    payload: UserCreateRequest,
    current_user: UserPublic = Depends(require_roles(UserRole.admin)),
    db: Session = Depends(get_db)
):
    """
    Create a new user account.
    
    Only accessible by Admin users.
    """
    from datetime import datetime, timezone
    import uuid
    
    # Check if email already exists
    existing = db.query(UserDB).filter(UserDB.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    
    # Check if username already exists
    if payload.username:
        existing_username = db.query(UserDB).filter(UserDB.username == payload.username.lower()).first()
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken"
            )
    
    # Create user
    new_user = UserDB(
        id=str(uuid.uuid4()),
        full_name=payload.full_name,
        email=payload.email.lower(),
        username=payload.username.lower() if payload.username else None,
        password_hash=_hash_password(payload.password),
        role=payload.role,
        department=payload.department,
        phone=payload.phone,
        is_active=1,
        failed_login_attempts=0,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserPublic(
        id=new_user.id,
        full_name=new_user.full_name,
        email=new_user.email,
        username=new_user.username,
        role=new_user.role,
        department=new_user.department,
        phone=new_user.phone,
        profile_photo=new_user.profile_photo,
        is_active=bool(new_user.is_active),
        account_status=new_user.account_status if hasattr(new_user, 'account_status') else "active",
        failed_login_attempts=new_user.failed_login_attempts if hasattr(new_user, 'failed_login_attempts') else 0,
        last_login=new_user.last_login,
        created_at=new_user.created_at
    )


@router.put("/{user_id}", response_model=UserPublic,
            summary="Update user (Admin only)")
def update_user(
    user_id: str,
    payload: UserUpdateRequest,
    current_user: UserPublic = Depends(require_roles(UserRole.admin)),
    db: Session = Depends(get_db)
):
    """
    Update user information.
    
    Only accessible by Admin users.
    """
    from datetime import datetime, timezone
    
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update fields
    if payload.full_name is not None:
        user.full_name = payload.full_name
    
    if payload.email is not None:
        # Check if email is taken
        existing = db.query(UserDB).filter(
            UserDB.email == payload.email.lower(),
            UserDB.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already in use"
            )
        user.email = payload.email.lower()
    
    if payload.username is not None:
        # Check if username is taken
        existing = db.query(UserDB).filter(
            UserDB.username == payload.username.lower(),
            UserDB.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken"
            )
        user.username = payload.username.lower()
    
    if payload.role is not None:
        user.role = payload.role
    
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
        created_at=user.created_at
    )


@router.post("/{user_id}/activate", response_model=UserPublic,
             summary="Activate user (Admin only)")
def activate_user(
    user_id: str,
    current_user: UserPublic = Depends(require_roles(UserRole.admin)),
    db: Session = Depends(get_db)
):
    """
    Activate a deactivated user account.
    
    Only accessible by Admin users.
    """
    from datetime import datetime, timezone
    
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = 1
    user.failed_login_attempts = 0  # Reset failed attempts
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
        created_at=user.created_at
    )


@router.post("/{user_id}/deactivate", response_model=UserPublic,
             summary="Deactivate user (Admin only)")
def deactivate_user(
    user_id: str,
    current_user: UserPublic = Depends(require_roles(UserRole.admin)),
    db: Session = Depends(get_db)
):
    """
    Deactivate a user account (soft delete).
    
    Only accessible by Admin users.
    """
    from datetime import datetime, timezone
    
    # Prevent admin from deactivating themselves
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = 0
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
        created_at=user.created_at
    )


@router.post("/{user_id}/reset-password",
             summary="Reset user password (Admin only)")
def reset_user_password(
    user_id: str,
    payload: PasswordResetRequest,
    current_user: UserPublic = Depends(require_roles(UserRole.admin)),
    db: Session = Depends(get_db)
):
    """
    Reset a user's password.
    
    Only accessible by Admin users.
    """
    from datetime import datetime, timezone
    
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.password_hash = _hash_password(payload.new_password)
    user.failed_login_attempts = 0  # Reset failed attempts
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    
    return {"message": f"Password reset successfully for {user.full_name}"}


@router.post("/{user_id}/unlock",
             summary="Unlock locked user account (Admin only)")
def unlock_user_account(
    user_id: str,
    current_user: UserPublic = Depends(require_roles(UserRole.admin)),
    db: Session = Depends(get_db)
):
    """
    Unlock a user account that was locked due to failed login attempts.
    
    Only accessible by Admin users.
    """
    from datetime import datetime, timezone
    
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.failed_login_attempts = 0
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    
    return {"message": f"Account unlocked successfully for {user.full_name}"}


@router.get("/stats/overview",
            summary="Get user statistics (Admin only)")
def get_user_stats(
    current_user: UserPublic = Depends(require_roles(UserRole.admin)),
    db: Session = Depends(get_db)
):
    """
    Get system-wide user statistics.
    
    Only accessible by Admin users.
    """
    from datetime import datetime, timedelta, timezone
    
    total_users = db.query(func.count(UserDB.id)).scalar()
    active_users = db.query(func.count(UserDB.id)).filter(UserDB.is_active == 1).scalar()
    inactive_users = total_users - active_users
    
    # Users by role
    admin_count = db.query(func.count(UserDB.id)).filter(UserDB.role == UserRole.admin).scalar()
    investigator_count = db.query(func.count(UserDB.id)).filter(UserDB.role == UserRole.investigator).scalar()
    viewer_count = db.query(func.count(UserDB.id)).filter(UserDB.role == UserRole.viewer).scalar()
    
    # Online users (logged in within last hour)
    one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
    online_users = db.query(func.count(UserDB.id)).filter(
        UserDB.last_login >= one_hour_ago,
        UserDB.is_active == 1
    ).scalar()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "online_users": online_users,
        "by_role": {
            "admin": admin_count,
            "investigator": investigator_count,
            "viewer": viewer_count
        }
    }


@router.post("/{user_id}/approve", response_model=UserPublic,
             summary="Approve pending user registration (Admin only)")
def approve_user(
    user_id: str,
    current_user: UserPublic = Depends(require_roles(UserRole.admin)),
    db: Session = Depends(get_db)
):
    """
    Approve a pending user registration.
    Changes account_status from 'pending' to 'active'.
    
    Only accessible by Admin users.
    """
    from datetime import datetime, timezone
    
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.account_status = "active"
    user.is_active = 1
    user.failed_login_attempts = 0
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    
    # Log approval
    try:
        from app.services.audit_service import AuditService
        AuditService.log_activity(
            db=db,
            user_id=current_user.id,
            action=f"Approved user registration: {user.full_name}",
            details=f"Email: {user.email}, Role: {user.role.value}",
            activity_type="user_management",
            resource_id=user_id
        )
    except Exception as e:
        print(f"Audit logging failed: {e}")
    
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
        created_at=user.created_at
    )


@router.post("/{user_id}/reject",
             summary="Reject pending user registration (Admin only)")
def reject_user(
    user_id: str,
    current_user: UserPublic = Depends(require_roles(UserRole.admin)),
    db: Session = Depends(get_db)
):
    """
    Reject a pending user registration.
    Changes account_status from 'pending' to 'rejected'.
    
    Only accessible by Admin users.
    """
    from datetime import datetime, timezone
    
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.account_status = "rejected"
    user.is_active = 0
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    
    # Log rejection
    try:
        from app.services.audit_service import AuditService
        AuditService.log_activity(
            db=db,
            user_id=current_user.id,
            action=f"Rejected user registration: {user.full_name}",
            details=f"Email: {user.email}, Role: {user.role.value}",
            activity_type="user_management",
            resource_id=user_id
        )
    except Exception as e:
        print(f"Audit logging failed: {e}")
    
    return {"message": f"User registration rejected for {user.full_name}"}


@router.post("/{user_id}/suspend", response_model=UserPublic,
             summary="Suspend user account (Admin only)")
def suspend_user(
    user_id: str,
    current_user: UserPublic = Depends(require_roles(UserRole.admin)),
    db: Session = Depends(get_db)
):
    """
    Suspend a user account temporarily.
    Changes account_status to 'suspended' and prevents login.
    
    Only accessible by Admin users.
    """
    from datetime import datetime, timezone
    
    # Prevent admin from suspending themselves
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot suspend your own account"
        )
    
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.account_status = "suspended"
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    
    # Log suspension
    try:
        from app.services.audit_service import AuditService
        AuditService.log_activity(
            db=db,
            user_id=current_user.id,
            action=f"Suspended user: {user.full_name}",
            details=f"Email: {user.email}",
            activity_type="user_management",
            resource_id=user_id
        )
    except Exception as e:
        print(f"Audit logging failed: {e}")
    
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
        created_at=user.created_at
    )


@router.delete("/{user_id}",
               summary="Delete user permanently (Admin only)")
def delete_user(
    user_id: str,
    current_user: UserPublic = Depends(require_roles(UserRole.admin)),
    db: Session = Depends(get_db)
):
    """
    Permanently delete a user account and all associated data.
    This includes cases, evidence, reports, audit logs, etc. due to CASCADE.
    
    Only accessible by Admin users.
    """
    from app.database.models import AuditLogDB, UserPreferencesDB
    
    # Prevent admin from deleting themselves
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user_email = user.email
    user_name = user.full_name
    
    # Log deletion before deleting
    try:
        from app.services.audit_service import AuditService
        AuditService.log_activity(
            db=db,
            user_id=current_user.id,
            action=f"Deleted user: {user_name}",
            details=f"Email: {user_email}, Role: {user.role.value}",
            activity_type="user_management",
            resource_id=user_id
        )
    except Exception as e:
        print(f"Audit logging failed: {e}")
    
    # Delete audit logs for this user (to avoid foreign key constraint)
    try:
        db.query(AuditLogDB).filter(AuditLogDB.user_id == user_id).delete()
    except Exception as e:
        print(f"Failed to delete audit logs: {e}")
    
    # Delete user preferences
    try:
        db.query(UserPreferencesDB).filter(UserPreferencesDB.user_id == user_id).delete()
    except Exception as e:
        print(f"Failed to delete user preferences: {e}")
    
    # Delete user (cases and other data will cascade)
    db.delete(user)
    db.commit()
    
    return {"message": f"User {user_name} ({user_email}) deleted successfully"}


@router.get("/{user_id}/profile",
            summary="Get user profile with stats (Admin only)")
def get_user_profile(
    user_id: str,
    current_user: UserPublic = Depends(require_roles(UserRole.admin)),
    db: Session = Depends(get_db)
):
    """
    Get detailed user profile including statistics and activity.
    
    Only accessible by Admin users.
    """
    from app.database.models import CaseDB, FraudReportDB, EvidenceDB, AuditLogDB
    
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get user statistics
    total_cases = db.query(func.count(CaseDB.case_id)).filter(CaseDB.owner_id == user_id).scalar()
    
    # Get recent login history from audit logs
    login_history = db.query(AuditLogDB).filter(
        AuditLogDB.user_id == user_id,
        AuditLogDB.activity_type == "login"
    ).order_by(AuditLogDB.created_at.desc()).limit(10).all()
    
    # Get recent activity
    recent_activity = db.query(AuditLogDB).filter(
        AuditLogDB.user_id == user_id
    ).order_by(AuditLogDB.created_at.desc()).limit(20).all()
    
    return {
        "user": UserPublic(
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
            created_at=user.created_at
        ),
        "stats": {
            "total_cases": total_cases,
        },
        "login_history": [
            {
                "timestamp": log.created_at,
                "ip_address": log.ip_address,
                "user_agent": log.user_agent,
                "action": log.action
            }
            for log in login_history
        ],
        "recent_activity": [
            {
                "timestamp": log.created_at,
                "action": log.action,
                "activity_type": log.activity_type,
                "details": log.details,
                "resource_id": log.resource_id
            }
            for log in recent_activity
        ]
    }


@router.get("/{user_id}/cases",
            summary="Get user's assigned cases (Admin only)")
def get_user_cases(
    user_id: str,
    current_user: UserPublic = Depends(require_roles(UserRole.admin)),
    db: Session = Depends(get_db)
):
    """
    Get all cases assigned to a specific user.
    
    Only accessible by Admin users.
    """
    from app.database.models import CaseDB
    
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    cases = db.query(CaseDB).filter(CaseDB.owner_id == user_id).order_by(CaseDB.created_at.desc()).all()
    
    return {
        "user_id": user_id,
        "user_name": user.full_name,
        "total_cases": len(cases),
        "cases": [
            {
                "case_id": c.case_id,
                "case_number": c.case_number,
                "title": c.title,
                "fraud_type": c.fraud_type,
                "status": c.status.value,
                "priority": c.priority.value,
                "created_at": c.created_at,
                "archived": bool(c.archived)
            }
            for c in cases
        ]
    }


@router.get("/{user_id}/reports",
            summary="Get user's generated reports (Admin only)")
def get_user_reports(
    user_id: str,
    current_user: UserPublic = Depends(require_roles(UserRole.admin)),
    db: Session = Depends(get_db)
):
    """
    Get all reports generated by a specific user.
    
    Only accessible by Admin users.
    """
    from app.database.models import FraudReportDB, CaseDB
    
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get reports from user's cases
    reports = db.query(FraudReportDB).join(
        CaseDB, CaseDB.case_id == FraudReportDB.case_id
    ).filter(
        CaseDB.owner_id == user_id
    ).order_by(FraudReportDB.created_at.desc()).all()
    
    return {
        "user_id": user_id,
        "user_name": user.full_name,
        "total_reports": len(reports),
        "reports": [
            {
                "report_id": r.id,
                "case_id": r.case_id,
                "risk_level": r.risk_level,
                "risk_score": r.risk_score,
                "created_at": r.created_at
            }
            for r in reports
        ]
    }
