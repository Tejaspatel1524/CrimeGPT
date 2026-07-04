import { CheckCircle, Circle, Clock } from 'lucide-react';
import type { Case } from '@/types';

interface InvestigationProgressProps {
  caseData: Case;
  hasAIReport: boolean;
  hasOCRProcessed: boolean;
  crossCaseMatches: number;
  recovery: { recovery_probability: number } | null;
}

export default function InvestigationProgress({ 
  caseData, 
  hasAIReport,
  hasOCRProcessed,
  crossCaseMatches,
  recovery
}: InvestigationProgressProps) {
  // Determine completion status for each stage
  const stages = [
    { 
      label: 'Case Registered', 
      completed: true, // Always true if we're viewing the case
      icon: CheckCircle 
    },
    { 
      label: 'Evidence Collected', 
      completed: caseData.evidence.length > 0,
      icon: caseData.evidence.length > 0 ? CheckCircle : Circle
    },
    { 
      label: 'OCR Processed', 
      completed: hasOCRProcessed,
      icon: hasOCRProcessed ? CheckCircle : Circle
    },
    { 
      label: 'Entity Extraction', 
      completed: caseData.entities.length > 0,
      icon: caseData.entities.length > 0 ? CheckCircle : Circle
    },
    { 
      label: 'Cross-case Analysis', 
      completed: crossCaseMatches > 0 || caseData.entities.length > 0,
      icon: crossCaseMatches > 0 || caseData.entities.length > 0 ? CheckCircle : Circle
    },
    { 
      label: 'Recovery Analysis', 
      completed: recovery !== null,
      icon: recovery !== null ? CheckCircle : Circle
    },
    { 
      label: 'Investigation Report Ready', 
      completed: hasAIReport,
      icon: hasAIReport ? CheckCircle : Circle
    },
  ];

  const completedCount = stages.filter(s => s.completed).length;
  const progressPercentage = (completedCount / stages.length) * 100;

  return (
    <div className="bg-[#061070] border border-white/[0.06] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#00B8FF]" />
          <h3 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider">Investigation Progress</h3>
        </div>
        <span className="text-xs font-semibold text-[#00B8FF]">{completedCount}/{stages.length} Completed</span>
      </div>

      {/* Progress Bar */}
      <div className="mb-5">
        <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full transition-all duration-700"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Stages */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {stages.map((stage, index) => (
          <div 
            key={index}
            className={`p-3 rounded-xl border transition-all ${
              stage.completed 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-white/[0.02] border-white/[0.06]'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <stage.icon className={`w-4 h-4 ${
                stage.completed ? 'text-emerald-400' : 'text-[#F8FAFC]0'
              }`} />
            </div>
            <p className={`text-xs font-medium leading-tight ${
              stage.completed ? 'text-emerald-400' : 'text-[#F8FAFC]0'
            }`}>
              {stage.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
