/**
 * Centralized Permission System for Role-Based Access Control (RBAC)
 * 
 * This module provides a type-safe permission checking system that prevents
 * scattering role checks across components.
 */

export type UserRole = 'admin' | 'investigator' | 'viewer';

export interface PermissionChecker {
  role: UserRole;
  canManageUsers: () => boolean;
  canAssignCase: () => boolean;
  canCreateCase: () => boolean;
  canEditCase: () => boolean;
  canDeleteCase: () => boolean;
  canArchiveCase: () => boolean;
  canGenerateReport: () => boolean;
  canUseCrimeGPT: () => boolean;
  canUploadEvidence: () => boolean;
  canEditEvidence: () => boolean;
  canDeleteEvidence: () => boolean;
  canManageEntities: () => boolean;
  canViewDashboard: () => boolean;
  canAccessSettings: () => boolean;
  canChangePassword: () => boolean;
  canViewProfile: () => boolean;
  canResetUserPassword: () => boolean;
  canActivateUser: () => boolean;
  canDeactivateUser: () => boolean;
  canChangeUserRole: () => boolean;
  canViewAuditLogs: () => boolean;
  canExportData: () => boolean;
  isAdmin: () => boolean;
  isInvestigator: () => boolean;
  isViewer: () => boolean;
}

/**
 * Permission Matrix by Role
 */
const PERMISSIONS: Record<UserRole, Record<string, boolean>> = {
  admin: {
    // User Management
    manageUsers: true,
    resetUserPassword: true,
    activateUser: true,
    deactivateUser: true,
    changeUserRole: true,
    viewAuditLogs: true,
    
    // Case Management
    assignCase: true,
    createCase: true,
    editCase: true,
    deleteCase: true,
    archiveCase: true,
    
    // Evidence
    uploadEvidence: true,
    editEvidence: true,
    deleteEvidence: true,
    
    // Reports & AI
    generateReport: true,
    useCrimeGPT: true,
    exportData: true,
    
    // Entities
    manageEntities: true,
    
    // General
    viewDashboard: true,
    accessSettings: true,
    changePassword: true,
    viewProfile: true,
  },
  
  investigator: {
    // User Management
    manageUsers: false,
    resetUserPassword: false,
    activateUser: false,
    deactivateUser: false,
    changeUserRole: false,
    viewAuditLogs: false,
    
    // Case Management (own cases only)
    assignCase: false, // Can only be assigned, not assign
    createCase: true,
    editCase: true, // Own cases only
    deleteCase: false,
    archiveCase: true, // Own cases only
    
    // Evidence
    uploadEvidence: true,
    editEvidence: true, // Own evidence only
    deleteEvidence: false,
    
    // Reports & AI
    generateReport: true,
    useCrimeGPT: true,
    exportData: true,
    
    // Entities
    manageEntities: true,
    
    // General
    viewDashboard: true,
    accessSettings: true,
    changePassword: true,
    viewProfile: true,
  },
  
  viewer: {
    // User Management
    manageUsers: false,
    resetUserPassword: false,
    activateUser: false,
    deactivateUser: false,
    changeUserRole: false,
    viewAuditLogs: false,
    
    // Case Management (read-only)
    assignCase: false,
    createCase: false,
    editCase: false,
    deleteCase: false,
    archiveCase: false,
    
    // Evidence (read-only)
    uploadEvidence: false,
    editEvidence: false,
    deleteEvidence: false,
    
    // Reports & AI (read-only)
    generateReport: false,
    useCrimeGPT: false,
    exportData: false,
    
    // Entities (read-only)
    manageEntities: false,
    
    // General
    viewDashboard: true,
    accessSettings: true, // Own settings only
    changePassword: true,
    viewProfile: true,
  },
};

/**
 * Create a permission checker for a given role
 */
export function createPermissionChecker(role: UserRole): PermissionChecker {
  const permissions = PERMISSIONS[role];
  
  return {
    role,
    canManageUsers: () => permissions.manageUsers,
    canAssignCase: () => permissions.assignCase,
    canCreateCase: () => permissions.createCase,
    canEditCase: () => permissions.editCase,
    canDeleteCase: () => permissions.deleteCase,
    canArchiveCase: () => permissions.archiveCase,
    canGenerateReport: () => permissions.generateReport,
    canUseCrimeGPT: () => permissions.useCrimeGPT,
    canUploadEvidence: () => permissions.uploadEvidence,
    canEditEvidence: () => permissions.editEvidence,
    canDeleteEvidence: () => permissions.deleteEvidence,
    canManageEntities: () => permissions.manageEntities,
    canViewDashboard: () => permissions.viewDashboard,
    canAccessSettings: () => permissions.accessSettings,
    canChangePassword: () => permissions.changePassword,
    canViewProfile: () => permissions.viewProfile,
    canResetUserPassword: () => permissions.resetUserPassword,
    canActivateUser: () => permissions.activateUser,
    canDeactivateUser: () => permissions.deactivateUser,
    canChangeUserRole: () => permissions.changeUserRole,
    canViewAuditLogs: () => permissions.viewAuditLogs,
    canExportData: () => permissions.exportData,
    isAdmin: () => role === 'admin',
    isInvestigator: () => role === 'investigator',
    isViewer: () => role === 'viewer',
  };
}

/**
 * React hook for permissions
 */
export function usePermissions(role: UserRole): PermissionChecker {
  return createPermissionChecker(role);
}

/**
 * Get permission description for UI
 */
export function getPermissionDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    admin: 'Full system access including user management, case assignment, and all operations',
    investigator: 'Can create and manage assigned cases, upload evidence, generate reports, and use AI features',
    viewer: 'Read-only access to cases, evidence, and reports. Cannot create or modify data',
  };
  return descriptions[role];
}

/**
 * Get role badge color
 */
export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    admin: 'bg-red-500/10 text-[#FF4D6D] border-red-500/20',
    investigator: 'bg-[#00B8FF]/10 text-[#00B8FF] border-cyan-500/20',
    viewer: 'bg-[#98A2B3]/10 text-[#98A2B3] border-slate-500/20',
  };
  return colors[role];
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    admin: 'Administrator',
    investigator: 'Investigator',
    viewer: 'Viewer',
  };
  return names[role];
}
