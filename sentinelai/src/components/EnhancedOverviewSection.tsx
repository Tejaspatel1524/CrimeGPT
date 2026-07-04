import { Shield, User, TrendingUp, Calendar, DollarSign, AlertTriangle, FileText, CheckCircle, Target } from 'lucide-react';
import { formatINR, formatDate } from '@/lib/formatters';
import type { Case } from '@/types';

interface EnhancedOverviewSectionProps {
  caseData: Case;
  recovery: {
    recovery_probability: number;
    recovery_level: string;
  } | null;
  crossCaseMatches: number;
  riskScore?: number;
}

export default function EnhancedOverviewSection({ 
  caseData, 
  recovery, 
  crossCaseMatches,
  riskScore 
}: EnhancedOverviewSectionProps) {
  const priorityColor = {
    Critical: 'text-red-400',
    High: 'text-amber-400',
    Medium: 'text-[#00B8FF]',
    Low: 'text-[#98A2B3]',
  }[caseData.priority];

  const statusColor = {
    Open: 'text-[#00B8FF]',
    'Under Investigation': 'text-amber-400',
    'Evidence Collection': 'text-purple-400',
    'Pending Review': 'text-indigo-400',
    Escalated: 'text-red-400',
    Closed: 'text-emerald-400',
    Resolved: 'text-teal-400',
  }[caseData.status];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Card 1: Case Information */}
      <div className="bg-[#061070] border border-white/[0.06] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-[#00B8FF]" />
          <h3 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider">Case Information</h3>
        </div>
        
        <div className="space-y-3">
          <div>
            <p className="text-[10px] text-[#F8FAFC]0 uppercase tracking-wider mb-1">Case Number</p>
            <p className="text-sm font-mono font-semibold text-white">{caseData.caseNumber || caseData.id.slice(0, 8)}</p>
          </div>
          
          <div>
            <p className="text-[10px] text-[#F8FAFC]0 uppercase tracking-wider mb-1">Fraud Type</p>
            <p className="text-sm font-medium text-[#F8FAFC]">{caseData.fraudCategory}</p>
          </div>
          
          <div>
            <p className="text-[10px] text-[#F8FAFC]0 uppercase tracking-wider mb-1">Priority</p>
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-3.5 h-3.5 ${priorityColor}`} />
              <p className={`text-sm font-semibold ${priorityColor}`}>{caseData.priority}</p>
            </div>
          </div>
          
          <div>
            <p className="text-[10px] text-[#F8FAFC]0 uppercase tracking-wider mb-1">Status</p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${statusColor.replace('text-', 'bg-')}`} />
              <p className={`text-sm font-medium ${statusColor}`}>{caseData.status}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Victim & Officer */}
      <div className="bg-[#061070] border border-white/[0.06] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider">Victim & Investigation</h3>
        </div>
        
        <div className="space-y-3">
          <div>
            <p className="text-[10px] text-[#F8FAFC]0 uppercase tracking-wider mb-1">Victim</p>
            <p className="text-sm font-medium text-[#F8FAFC]">{caseData.victim.name}</p>
            <p className="text-xs text-[#F8FAFC]0 mt-0.5">{caseData.victim.contact}</p>
          </div>
          
          <div>
            <p className="text-[10px] text-[#F8FAFC]0 uppercase tracking-wider mb-1">Amount Lost</p>
            <div className="flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-red-400" />
              <p className="text-sm font-bold text-red-400">{formatINR(caseData.amountLost)}</p>
            </div>
          </div>
          
          <div>
            <p className="text-[10px] text-[#F8FAFC]0 uppercase tracking-wider mb-1">Assigned Officer</p>
            <p className="text-sm font-medium text-[#F8FAFC]">{caseData.assignedOfficer.name}</p>
            <p className="text-xs text-[#F8FAFC]0 mt-0.5">{caseData.assignedOfficer.rank} • {caseData.assignedOfficer.department}</p>
          </div>
          
          <div>
            <p className="text-[10px] text-[#F8FAFC]0 uppercase tracking-wider mb-1">Created Date</p>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#98A2B3]" />
              <p className="text-sm font-medium text-[#F8FAFC]">{formatDate(caseData.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Intelligence Metrics */}
      <div className="bg-[#061070] border border-white/[0.06] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider">Intelligence Metrics</h3>
        </div>
        
        <div className="space-y-3">
          <div>
            <p className="text-[10px] text-[#F8FAFC]0 uppercase tracking-wider mb-1">Recovery Probability</p>
            {recovery ? (
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-2xl font-bold text-emerald-400">{recovery.recovery_probability}%</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    recovery.recovery_level === 'High' ? 'bg-emerald-500/20 text-emerald-400' :
                    recovery.recovery_level === 'Medium' ? 'bg-cyan-500/20 text-[#00B8FF]' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>{recovery.recovery_level}</span>
                </div>
                <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${recovery.recovery_probability}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#F8FAFC]0 italic">Calculating...</p>
            )}
          </div>
          
          <div>
            <p className="text-[10px] text-[#F8FAFC]0 uppercase tracking-wider mb-1">Risk Score</p>
            {riskScore !== undefined ? (
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                  riskScore >= 80 ? 'from-red-500 to-red-700' :
                  riskScore >= 50 ? 'from-amber-500 to-amber-700' :
                  'from-emerald-500 to-emerald-700'
                } flex items-center justify-center shadow-lg`}>
                  <span className="text-sm font-bold text-white">{riskScore}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[#98A2B3]">Fraud Risk Assessment</p>
                  <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden mt-1">
                    <div 
                      className={`h-full rounded-full ${
                        riskScore >= 80 ? 'bg-red-500' :
                        riskScore >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${riskScore}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#F8FAFC]0 italic">Not analyzed</p>
            )}
          </div>
          
          <div>
            <p className="text-[10px] text-[#F8FAFC]0 uppercase tracking-wider mb-1">Cross-case Matches</p>
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              <p className="text-sm font-semibold text-indigo-400">{crossCaseMatches} linked case{crossCaseMatches !== 1 ? 's' : ''}</p>
            </div>
          </div>
          
          <div>
            <p className="text-[10px] text-[#F8FAFC]0 uppercase tracking-wider mb-1">Evidence Count</p>
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <p className="text-sm font-semibold text-purple-400">{caseData.evidence.length} item{caseData.evidence.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
