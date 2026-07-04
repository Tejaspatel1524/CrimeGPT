from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database.database import get_db
from app.schemas.user import (
    RegisterRequest, LoginRequest, LoginResponse, UserPublic,
    UserUpdate, PasswordChangeRequest, ForgotPasswordRequest, ResetPasswordRequest
)
from app.services.auth_service import (
    register_user, login_user, get_current_user,
    update_user_profile, change_password, forgot_password, reset_password
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserPublic, status_code=201,
             summary="Register a new user")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user account.
    
    - **full_name**: User's full name
    - **email**: User's email (must be unique)
    - **password**: User's password (will be hashed)
    - **role**: User role (admin, investigator, viewer)
    - **department**: Optional department name
    """
    return register_user(payload, db)


@router.post("/login", response_model=LoginResponse,
             summary="Login and receive a JWT token")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with email and password.
    
    - Returns JWT access token
    - Token expires in 8 hours (or 30 days with remember_me)
    - Failed attempts are tracked (max 5 before account lock)
    """
    return login_user(payload.email, payload.password, db, payload.remember_me)


@router.get("/me", response_model=UserPublic,
            summary="Get current authenticated user")
def me(current_user: UserPublic = Depends(get_current_user)):
    """
    Get the currently authenticated user's profile.
    
    Requires valid JWT token in Authorization header.
    """
    return current_user


@router.put("/profile", response_model=UserPublic,
            summary="Update user profile")
def update_profile(
    payload: UserUpdate,
    current_user: UserPublic = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update the current user's profile.
    
    - **full_name**: Update user's name
    - **department**: Update department
    - **profile_photo**: Update profile photo URL
    """
    return update_user_profile(current_user.id, payload, db)


@router.post("/change-password",
             summary="Change password")
def change_user_password(
    payload: PasswordChangeRequest,
    current_user: UserPublic = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change the current user's password.
    
    Requires current password for verification.
    """
    return change_password(current_user.id, payload, db)


@router.post("/forgot-password",
             summary="Request password reset")
def forgot_user_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Request a password reset link.
    
    **Note**: Email service not configured. This is a placeholder.
    In production, this would send a reset link to the user's email.
    """
    return forgot_password(payload, db)


@router.post("/reset-password",
             summary="Reset password with token")
def reset_user_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset password using a reset token.
    
    **Note**: This is a placeholder implementation.
    In production, the token would be sent via email.
    """
    return reset_password(payload, db)


@router.get("/stats",
            summary="Get current user statistics")
def get_user_stats(
    current_user: UserPublic = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get statistics for the current authenticated user.
    
    Returns:
    - cases_assigned: Total cases assigned to user
    - cases_closed: Cases with status 'Closed' or 'Resolved'
    - reports_generated: Fraud reports for user's cases
    - evidence_uploaded: Evidence count for user's cases
    - active_cases: Cases with status 'Open', 'Under Investigation', etc.
    """
    from app.database.models import CaseDB, FraudReportDB, EvidenceDB
    from app.models.case import CaseStatus
    
    # Cases assigned
    cases_assigned = db.query(CaseDB).filter(CaseDB.owner_id == current_user.id).count()
    
    # Cases closed
    cases_closed = db.query(CaseDB).filter(
        CaseDB.owner_id == current_user.id,
        CaseDB.status == CaseStatus.closed
    ).count()
    
    # Active cases (not closed)
    active_cases = db.query(CaseDB).filter(
        CaseDB.owner_id == current_user.id,
        CaseDB.status != CaseStatus.closed
    ).count()
    
    # Reports generated (fraud reports for user's cases)
    user_case_ids = db.query(CaseDB.case_id).filter(CaseDB.owner_id == current_user.id).subquery()
    reports_generated = db.query(FraudReportDB).filter(
        FraudReportDB.case_id.in_(user_case_ids)
    ).count()
    
    # Evidence uploaded (evidence for user's cases)
    evidence_uploaded = db.query(EvidenceDB).filter(
        EvidenceDB.case_id.in_(user_case_ids)
    ).count()
    
    return {
        "cases_assigned": cases_assigned,
        "cases_closed": cases_closed,
        "active_cases": active_cases,
        "reports_generated": reports_generated,
        "evidence_uploaded": evidence_uploaded,
    }


@router.get("/activity",
            summary="Get current user recent activity")
def get_user_activity(
    limit: int = 50,
    activity_type: str = None,
    current_user: UserPublic = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get recent activity logs for the current authenticated user.
    
    Parameters:
    - limit: Maximum number of activities to return (default: 50)
    - activity_type: Filter by type (login, case, report, evidence, note, profile, settings)
    
    Returns:
    - List of recent activity logs with action, details, timestamp, type
    """
    from app.services.audit_service import AuditService
    
    activities = AuditService.get_user_activity(
        db=db,
        user_id=current_user.id,
        limit=limit,
        activity_type=activity_type
    )
    
    return [
        {
            "id": activity.id,
            "action": activity.action,
            "details": activity.details or "",
            "timestamp": activity.created_at.isoformat(),
            "type": activity.activity_type,
            "resource_id": activity.resource_id
        }
        for activity in activities
    ]


@router.get("/preferences",
            summary="Get current user preferences")
def get_user_preferences(
    current_user: UserPublic = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get preferences for the current authenticated user.
    Returns default preferences if none exist.
    """
    from app.database.models import UserPreferencesDB
    
    prefs = db.query(UserPreferencesDB).filter(
        UserPreferencesDB.user_id == current_user.id
    ).first()
    
    if not prefs:
        # Return defaults
        return {
            "theme": "cyber-navy",
            "language": "english",
            "timezone": "auto",
            "dateFormat": "dd/mm/yyyy",
            "timeFormat": "24h",
            "notifications": {
                "caseAssignment": True,
                "crimeGPT": True,
                "evidenceProcessing": True,
                "reportGeneration": True,
                "crossCaseMatch": True
            }
        }
    
    return {
        "theme": prefs.theme,
        "language": prefs.language,
        "timezone": prefs.timezone,
        "dateFormat": prefs.date_format,
        "timeFormat": prefs.time_format,
        "notifications": {
            "caseAssignment": bool(prefs.notifications_case_assignment),
            "crimeGPT": bool(prefs.notifications_crimegpt),
            "evidenceProcessing": bool(prefs.notifications_evidence),
            "reportGeneration": bool(prefs.notifications_report),
            "crossCaseMatch": bool(prefs.notifications_cross_case)
        }
    }


@router.put("/preferences",
            summary="Update current user preferences")
def update_user_preferences(
    payload: dict,
    current_user: UserPublic = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update preferences for the current authenticated user.
    Creates preferences if none exist.
    """
    from app.database.models import UserPreferencesDB
    import uuid
    
    prefs = db.query(UserPreferencesDB).filter(
        UserPreferencesDB.user_id == current_user.id
    ).first()
    
    if not prefs:
        # Create new preferences
        prefs = UserPreferencesDB(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            theme=payload.get("theme", "cyber-navy"),
            language=payload.get("language", "english"),
            timezone=payload.get("timezone", "auto"),
            date_format=payload.get("dateFormat", "dd/mm/yyyy"),
            time_format=payload.get("timeFormat", "24h"),
            notifications_case_assignment=1 if payload.get("notifications", {}).get("caseAssignment", True) else 0,
            notifications_crimegpt=1 if payload.get("notifications", {}).get("crimeGPT", True) else 0,
            notifications_evidence=1 if payload.get("notifications", {}).get("evidenceProcessing", True) else 0,
            notifications_report=1 if payload.get("notifications", {}).get("reportGeneration", True) else 0,
            notifications_cross_case=1 if payload.get("notifications", {}).get("crossCaseMatch", True) else 0,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.add(prefs)
    else:
        # Update existing preferences
        if "theme" in payload:
            prefs.theme = payload["theme"]
        if "language" in payload:
            prefs.language = payload["language"]
        if "timezone" in payload:
            prefs.timezone = payload["timezone"]
        if "dateFormat" in payload:
            prefs.date_format = payload["dateFormat"]
        if "timeFormat" in payload:
            prefs.time_format = payload["timeFormat"]
        
        if "notifications" in payload:
            notifs = payload["notifications"]
            if "caseAssignment" in notifs:
                prefs.notifications_case_assignment = 1 if notifs["caseAssignment"] else 0
            if "crimeGPT" in notifs:
                prefs.notifications_crimegpt = 1 if notifs["crimeGPT"] else 0
            if "evidenceProcessing" in notifs:
                prefs.notifications_evidence = 1 if notifs["evidenceProcessing"] else 0
            if "reportGeneration" in notifs:
                prefs.notifications_report = 1 if notifs["reportGeneration"] else 0
            if "crossCaseMatch" in notifs:
                prefs.notifications_cross_case = 1 if notifs["crossCaseMatch"] else 0
        
        prefs.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    
    # Log activity
    try:
        from app.services.audit_service import AuditService
        AuditService.log_activity(
            db=db,
            user_id=current_user.id,
            action="Updated Settings",
            details="Changed preferences or notification settings",
            activity_type="settings"
        )
    except Exception as e:
        print(f"Audit logging failed: {e}")
    
    return {"message": "Preferences updated successfully"}


@router.get("/permissions",
            summary="Get current user permissions")
def get_user_permissions(
    current_user: UserPublic = Depends(get_current_user)
):
    """
    Get all permissions for the current authenticated user based on their role.
    
    Returns a list of permission strings that the frontend can use to show/hide UI elements.
    """
    from app.utils.permissions import PermissionChecker
    
    permissions = PermissionChecker.get_permissions(current_user.role)
    
    return {
        "role": current_user.role.value,
        "permissions": [perm.value for perm in permissions]
    }

