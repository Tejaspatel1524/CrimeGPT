"""
Role-Based Access Control (RBAC) System
Defines permissions for Admin, Investigator, and Viewer roles
"""
from enum import Enum
from typing import List, Set
from app.models.user import UserRole


class Permission(str, Enum):
    """All possible permissions in the system"""
    
    # User Management
    CREATE_USER = "create_user"
    VIEW_USERS = "view_users"
    EDIT_USER = "edit_user"
    DELETE_USER = "delete_user"
    ASSIGN_ROLES = "assign_roles"
    UNLOCK_USER = "unlock_user"
    
    # Case Management
    CREATE_CASE = "create_case"
    VIEW_ALL_CASES = "view_all_cases"
    VIEW_OWN_CASES = "view_own_cases"
    EDIT_OWN_CASES = "edit_own_cases"
    EDIT_ALL_CASES = "edit_all_cases"
    DELETE_CASE = "delete_case"
    ASSIGN_CASE = "assign_case"
    ARCHIVE_CASE = "archive_case"
    
    # Evidence Management
    UPLOAD_EVIDENCE = "upload_evidence"
    VIEW_EVIDENCE = "view_evidence"
    DELETE_EVIDENCE = "delete_evidence"
    PROCESS_OCR = "process_ocr"
    
    # Reports & Analysis
    GENERATE_REPORT = "generate_report"
    VIEW_REPORTS = "view_reports"
    EXPORT_REPORT = "export_report"
    DELETE_REPORT = "delete_report"
    
    # CrimeGPT
    USE_CRIMEGPT = "use_crimegpt"
    VIEW_CHAT_HISTORY = "view_chat_history"
    
    # Entity & Intelligence
    VIEW_ENTITIES = "view_entities"
    ADD_ENTITY = "add_entity"
    EDIT_ENTITY = "edit_entity"
    DELETE_ENTITY = "delete_entity"
    VIEW_RELATIONSHIP_GRAPH = "view_relationship_graph"
    VIEW_CROSS_CASE_INTELLIGENCE = "view_cross_case_intelligence"
    
    # Notes
    ADD_NOTE = "add_note"
    VIEW_NOTES = "view_notes"
    EDIT_OWN_NOTES = "edit_own_notes"
    DELETE_OWN_NOTES = "delete_own_notes"
    
    # System
    VIEW_DASHBOARD = "view_dashboard"
    VIEW_SYSTEM_STATS = "view_system_stats"
    EXPORT_DATA = "export_data"
    VIEW_AUDIT_LOGS = "view_audit_logs"


# Role-Permission Matrix
ROLE_PERMISSIONS: dict[UserRole, Set[Permission]] = {
    
    # ADMIN: Full system access
    UserRole.admin: {
        # User Management - Full access
        Permission.CREATE_USER,
        Permission.VIEW_USERS,
        Permission.EDIT_USER,
        Permission.DELETE_USER,
        Permission.ASSIGN_ROLES,
        Permission.UNLOCK_USER,
        
        # Case Management - Full access
        Permission.CREATE_CASE,
        Permission.VIEW_ALL_CASES,
        Permission.EDIT_ALL_CASES,
        Permission.DELETE_CASE,
        Permission.ASSIGN_CASE,
        Permission.ARCHIVE_CASE,
        
        # Evidence - Full access
        Permission.UPLOAD_EVIDENCE,
        Permission.VIEW_EVIDENCE,
        Permission.DELETE_EVIDENCE,
        Permission.PROCESS_OCR,
        
        # Reports - Full access
        Permission.GENERATE_REPORT,
        Permission.VIEW_REPORTS,
        Permission.EXPORT_REPORT,
        Permission.DELETE_REPORT,
        
        # CrimeGPT - Full access
        Permission.USE_CRIMEGPT,
        Permission.VIEW_CHAT_HISTORY,
        
        # Entity & Intelligence - Full access
        Permission.VIEW_ENTITIES,
        Permission.ADD_ENTITY,
        Permission.EDIT_ENTITY,
        Permission.DELETE_ENTITY,
        Permission.VIEW_RELATIONSHIP_GRAPH,
        Permission.VIEW_CROSS_CASE_INTELLIGENCE,
        
        # Notes - Full access
        Permission.ADD_NOTE,
        Permission.VIEW_NOTES,
        Permission.EDIT_OWN_NOTES,
        Permission.DELETE_OWN_NOTES,
        
        # System - Full access
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_SYSTEM_STATS,
        Permission.EXPORT_DATA,
        Permission.VIEW_AUDIT_LOGS,
    },
    
    # INVESTIGATOR: Case investigation and analysis
    UserRole.investigator: {
        # User Management - None
        
        # Case Management - Own cases only
        Permission.CREATE_CASE,
        Permission.VIEW_OWN_CASES,
        Permission.EDIT_OWN_CASES,
        Permission.ARCHIVE_CASE,  # Can archive own cases
        
        # Evidence - Full access for own cases
        Permission.UPLOAD_EVIDENCE,
        Permission.VIEW_EVIDENCE,
        Permission.PROCESS_OCR,
        
        # Reports - Generate and view
        Permission.GENERATE_REPORT,
        Permission.VIEW_REPORTS,
        Permission.EXPORT_REPORT,
        
        # CrimeGPT - Full access
        Permission.USE_CRIMEGPT,
        Permission.VIEW_CHAT_HISTORY,
        
        # Entity & Intelligence - Full access
        Permission.VIEW_ENTITIES,
        Permission.ADD_ENTITY,
        Permission.EDIT_ENTITY,
        Permission.VIEW_RELATIONSHIP_GRAPH,
        Permission.VIEW_CROSS_CASE_INTELLIGENCE,
        
        # Notes - Full access to own notes
        Permission.ADD_NOTE,
        Permission.VIEW_NOTES,
        Permission.EDIT_OWN_NOTES,
        Permission.DELETE_OWN_NOTES,
        
        # System - Basic access
        Permission.VIEW_DASHBOARD,
        Permission.EXPORT_DATA,
    },
    
    # VIEWER: Read-only access
    UserRole.viewer: {
        # User Management - None
        
        # Case Management - Read-only all cases
        Permission.VIEW_ALL_CASES,
        
        # Evidence - View only
        Permission.VIEW_EVIDENCE,
        
        # Reports - View and export only
        Permission.VIEW_REPORTS,
        Permission.EXPORT_REPORT,
        
        # CrimeGPT - None
        
        # Entity & Intelligence - View only
        Permission.VIEW_ENTITIES,
        Permission.VIEW_RELATIONSHIP_GRAPH,
        Permission.VIEW_CROSS_CASE_INTELLIGENCE,
        
        # Notes - View only
        Permission.VIEW_NOTES,
        
        # System - Basic read-only
        Permission.VIEW_DASHBOARD,
    }
}


class PermissionChecker:
    """Utility class for checking permissions"""
    
    @staticmethod
    def has_permission(role: UserRole, permission: Permission) -> bool:
        """Check if a role has a specific permission"""
        return permission in ROLE_PERMISSIONS.get(role, set())
    
    @staticmethod
    def has_any_permission(role: UserRole, permissions: List[Permission]) -> bool:
        """Check if a role has any of the specified permissions"""
        role_perms = ROLE_PERMISSIONS.get(role, set())
        return any(perm in role_perms for perm in permissions)
    
    @staticmethod
    def has_all_permissions(role: UserRole, permissions: List[Permission]) -> bool:
        """Check if a role has all of the specified permissions"""
        role_perms = ROLE_PERMISSIONS.get(role, set())
        return all(perm in role_perms for perm in permissions)
    
    @staticmethod
    def get_permissions(role: UserRole) -> Set[Permission]:
        """Get all permissions for a role"""
        return ROLE_PERMISSIONS.get(role, set())
    
    @staticmethod
    def can_access_case(role: UserRole, case_owner_id: str, current_user_id: str) -> bool:
        """Check if user can access a specific case"""
        if role == UserRole.admin or role == UserRole.viewer:
            return True  # Admin and Viewer see all cases
        
        if role == UserRole.investigator:
            return case_owner_id == current_user_id  # Investigators see only their cases
        
        return False
    
    @staticmethod
    def can_edit_case(role: UserRole, case_owner_id: str, current_user_id: str) -> bool:
        """Check if user can edit a specific case"""
        if role == UserRole.admin:
            return True  # Admin can edit all
        
        if role == UserRole.investigator:
            return case_owner_id == current_user_id  # Investigators edit only their cases
        
        return False  # Viewers cannot edit


# Export for easy access
def has_permission(role: UserRole, permission: Permission) -> bool:
    """Shorthand for permission check"""
    return PermissionChecker.has_permission(role, permission)
