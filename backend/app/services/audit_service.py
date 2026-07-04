"""
Audit Logging Service
Tracks all user activities for compliance and security monitoring
"""
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.database.models import AuditLogDB
import uuid


class AuditService:
    """Service for logging user activities"""

    @staticmethod
    def log_activity(
        db: Session,
        user_id: str,
        action: str,
        details: Optional[str] = None,
        activity_type: str = "action",
        resource_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLogDB:
        """
        Log a user activity
        
        Args:
            db: Database session
            user_id: ID of the user performing the action
            action: Action name (e.g., "Logged In", "Created Case", "Uploaded Evidence")
            details: Additional details about the action
            activity_type: Type of activity (login, case, report, evidence, note, profile, settings)
            resource_id: ID of the resource affected (case_id, evidence_id, etc.)
            ip_address: IP address of the request
            user_agent: User agent string
            
        Returns:
            Created audit log entry
        """
        audit_log = AuditLogDB(
            id=str(uuid.uuid4()),
            user_id=user_id,
            action=action,
            details=details,
            activity_type=activity_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=datetime.now(timezone.utc)
        )
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        return audit_log

    @staticmethod
    def get_user_activity(
        db: Session,
        user_id: str,
        limit: int = 50,
        activity_type: Optional[str] = None
    ) -> list:
        """
        Get recent activity for a user
        
        Args:
            db: Database session
            user_id: ID of the user
            limit: Maximum number of activities to return
            activity_type: Filter by activity type (optional)
            
        Returns:
            List of audit log entries
        """
        query = db.query(AuditLogDB).filter(AuditLogDB.user_id == user_id)
        
        if activity_type:
            query = query.filter(AuditLogDB.activity_type == activity_type)
        
        return query.order_by(AuditLogDB.created_at.desc()).limit(limit).all()

    @staticmethod
    def get_all_activity(
        db: Session,
        limit: int = 100,
        activity_type: Optional[str] = None
    ) -> list:
        """
        Get recent activity for all users (admin only)
        
        Args:
            db: Database session
            limit: Maximum number of activities to return
            activity_type: Filter by activity type (optional)
            
        Returns:
            List of audit log entries
        """
        query = db.query(AuditLogDB)
        
        if activity_type:
            query = query.filter(AuditLogDB.activity_type == activity_type)
        
        return query.order_by(AuditLogDB.created_at.desc()).limit(limit).all()
