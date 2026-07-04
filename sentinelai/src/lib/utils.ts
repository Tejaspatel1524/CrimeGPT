import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { CasePriority, CaseStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getPriorityColor(priority: CasePriority): string {
  const colors: Record<CasePriority, string> = {
    Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
    High: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };
  return colors[priority];
}

export function getPriorityDot(priority: CasePriority): string {
  const colors: Record<CasePriority, string> = {
    Critical: 'bg-red-400',
    High: 'bg-orange-400',
    Medium: 'bg-amber-400',
    Low: 'bg-emerald-400',
  };
  return colors[priority];
}

export function getStatusColor(status: CaseStatus): string {
  const colors: Record<CaseStatus, string> = {
    Open: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'Under Investigation': 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    'Evidence Collection': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    'Pending Review': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Escalated: 'bg-red-500/15 text-red-400 border-red-500/30',
    Closed: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    Resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };
  return colors[status];
}

export function getEntityIcon(type: string): string {
  const icons: Record<string, string> = {
    'Phone Number': '📱',
    'UPI ID': '💳',
    'Email Address': '📧',
    Website: '🌐',
    'Telegram Handle': '✈️',
    'Bank Account': '🏦',
    'Social Media': '👤',
    'IP Address': '🖥️',
  };
  return icons[type] || '📋';
}

export function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

export function generateCaseId(): string {
  const prefix = 'SAI';
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${year}-${num}`;
}
