import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

export type Permission = 
  // User Management
  | 'create_user'
  | 'view_users'
  | 'edit_user'
  | 'delete_user'
  | 'assign_roles'
  | 'unlock_user'
  
  // Case Management
  | 'create_case'
  | 'view_all_cases'
  | 'view_own_cases'
  | 'edit_own_cases'
  | 'edit_all_cases'
  | 'delete_case'
  | 'assign_case'
  | 'archive_case'
  
  // Evidence
  | 'upload_evidence'
  | 'view_evidence'
  | 'delete_evidence'
  | 'process_ocr'
  
  // Reports
  | 'generate_report'
  | 'view_reports'
  | 'export_report'
  | 'delete_report'
  
  // CrimeGPT
  | 'use_crimegpt'
  | 'view_chat_history'
  
  // Entity & Intelligence
  | 'view_entities'
  | 'add_entity'
  | 'edit_entity'
  | 'delete_entity'
  | 'view_relationship_graph'
  | 'view_cross_case_intelligence'
  
  // Notes
  | 'add_note'
  | 'view_notes'
  | 'edit_own_notes'
  | 'delete_own_notes'
  
  // System
  | 'view_dashboard'
  | 'view_system_stats'
  | 'export_data'
  | 'view_audit_logs';

interface PermissionsData {
  role: string;
  permissions: Permission[];
}

export function usePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get<PermissionsData>('/auth/permissions');
        setPermissions(response.data.permissions as Permission[]);
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user]);

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (perms: Permission[]): boolean => {
    return perms.some(perm => permissions.includes(perm));
  };

  const hasAllPermissions = (perms: Permission[]): boolean => {
    return perms.every(perm => permissions.includes(perm));
  };

  const isAdmin = user?.role === 'admin';
  const isInvestigator = user?.role === 'investigator';
  const isViewer = user?.role === 'viewer';

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isInvestigator,
    isViewer,
    role: user?.role || 'viewer'
  };
}
