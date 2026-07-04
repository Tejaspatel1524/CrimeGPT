import {
  LayoutDashboard, Users, Briefcase, FileText, Shield,
  TrendingUp, Settings, User, BookOpen, Sparkles,
  Activity, BarChart3, Clock, AlertTriangle
} from 'lucide-react';

export interface QuickAction {
  id: string;
  label: string;
  icon: any;
  path: string;
  color: string;
  bgColor: string;
  description: string;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  badge?: string;
}

export interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

export interface DashboardConfig {
  quickActions: QuickAction[];
  sidebar: SidebarGroup[];
  defaultRoute: string;
  welcomeMessage: string;
}

// ADMIN CONFIGURATION
export const adminConfig: DashboardConfig = {
  defaultRoute: '/dashboard',
  welcomeMessage: 'System Overview & Administration',
  
  quickActions: [
    {
      id: 'create-user',
      label: 'Create User',
      icon: Users,
      path: '/team',
      color: 'text-[#00B8FF]',
      bgColor: 'bg-[#00B8FF]/10',
      description: 'Add new team member'
    },
    {
      id: 'view-all-cases',
      label: 'All Cases',
      icon: Briefcase,
      path: '/cases',
      color: 'text-[#FFB020]',
      bgColor: 'bg-amber-500/10',
      description: 'View all investigations'
    },
    {
      id: 'system-reports',
      label: 'System Reports',
      icon: FileText,
      path: '/reports',
      color: 'text-[#00D084]',
      bgColor: 'bg-emerald-500/10',
      description: 'Generate analytics'
    },
    {
      id: 'crimegpt',
      label: 'CrimeGPT',
      icon: Sparkles,
      path: '/cases',
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
      description: 'AI-powered analysis'
    }
  ],
  
  sidebar: [
    {
      label: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { id: 'team', label: 'Team Management', icon: Users, path: '/team' }
      ]
    },
    {
      label: 'INVESTIGATIONS',
      items: [
        { id: 'cases', label: 'All Cases', icon: Briefcase, path: '/cases' },
        { id: 'reports', label: 'Reports', icon: FileText, path: '/reports' }
      ]
    },
    {
      label: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
        { id: 'profile', label: 'Profile', icon: User, path: '/profile' }
      ]
    }
  ]
};

// INVESTIGATOR CONFIGURATION
export const investigatorConfig: DashboardConfig = {
  defaultRoute: '/dashboard',
  welcomeMessage: 'My Cases & Investigations',
  
  quickActions: [
    {
      id: 'create-case',
      label: 'New Case',
      icon: Briefcase,
      path: '/cases',
      color: 'text-[#00B8FF]',
      bgColor: 'bg-[#00B8FF]/10',
      description: 'Create new investigation'
    },
    {
      id: 'my-cases',
      label: 'My Cases',
      icon: Activity,
      path: '/cases',
      color: 'text-[#FFB020]',
      bgColor: 'bg-amber-500/10',
      description: 'View assigned cases'
    },
    {
      id: 'crimegpt',
      label: 'CrimeGPT',
      icon: Sparkles,
      path: '/cases',
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
      description: 'AI assistant'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      path: '/reports',
      color: 'text-[#00D084]',
      bgColor: 'bg-emerald-500/10',
      description: 'Generate reports'
    }
  ],
  
  sidebar: [
    {
      label: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' }
      ]
    },
    {
      label: 'MY WORK',
      items: [
        { id: 'cases', label: 'My Cases', icon: Briefcase, path: '/cases' },
        { id: 'reports', label: 'Reports', icon: FileText, path: '/reports' }
      ]
    },
    {
      label: 'ACCOUNT',
      items: [
        { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
        { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
      ]
    }
  ]
};

// VIEWER CONFIGURATION
export const viewerConfig: DashboardConfig = {
  defaultRoute: '/dashboard',
  welcomeMessage: 'Case Overview & Reports',
  
  quickActions: [
    {
      id: 'view-cases',
      label: 'View Cases',
      icon: Briefcase,
      path: '/cases',
      color: 'text-[#00B8FF]',
      bgColor: 'bg-[#00B8FF]/10',
      description: 'Browse all cases'
    },
    {
      id: 'view-reports',
      label: 'Reports',
      icon: FileText,
      path: '/reports',
      color: 'text-[#00D084]',
      bgColor: 'bg-emerald-500/10',
      description: 'View reports'
    },
    {
      id: 'statistics',
      label: 'Statistics',
      icon: BarChart3,
      path: '/dashboard',
      color: 'text-[#FFB020]',
      bgColor: 'bg-amber-500/10',
      description: 'View analytics'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: '/profile',
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
      description: 'My profile'
    }
  ],
  
  sidebar: [
    {
      label: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' }
      ]
    },
    {
      label: 'VIEW',
      items: [
        { id: 'cases', label: 'Cases', icon: Briefcase, path: '/cases' },
        { id: 'reports', label: 'Reports', icon: FileText, path: '/reports' }
      ]
    },
    {
      label: 'ACCOUNT',
      items: [
        { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
        { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
      ]
    }
  ]
};

export function getRoleConfig(role: string): DashboardConfig {
  switch (role) {
    case 'admin':
      return adminConfig;
    case 'investigator':
      return investigatorConfig;
    case 'viewer':
      return viewerConfig;
    default:
      return viewerConfig; // Default to most restrictive
  }
}
