import { useState, useMemo, useCallback } from 'react';
import { ReactFlow, Controls, Background, MiniMap, type Node, type Edge, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Network, AlertTriangle, Link2, Shield, Eye, User, Phone, Mail, Clock, MousePointer, Search
} from 'lucide-react';
import { formatINR } from '@/lib/formatters';
import type { Case, Entity, Evidence } from '@/types';

interface Props {
  caseData: Case;
  nodes: Node[];
  edges: Edge[];
  onNodesChange: any;
  onEdgesChange: any;
  onNodeClick: any;
  selectedNode: Node | null;
  graphSearch: string;
  setGraphSearch: (val: string) => void;
  entityGraphConfig: Record<string, { color: string; border: string; icon: string }>;
  graphApiData: Record<string, any>;
  linkedCases: any;
  setEntityDrawer: (ent: Entity) => void;
}

// Risk Bar Component
function RiskBar({ level, score }: { level: string; score?: number }) {
  const riskScore = score || (level === 'High' ? 80 : level === 'Medium' ? 50 : 30);
  const color = level === 'High' ? 'bg-red-500' : level === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500';
  const text = level === 'High' ? 'text-red-400' : level === 'Medium' ? 'text-amber-400' : 'text-emerald-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#0B1220]/50 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${riskScore}%` }} />
      </div>
      <span className={`text-xs font-bold ${text}`}>{riskScore}</span>
    </div>
  );
}

export default function EnterpriseRelationshipGraph({
  caseData,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  selectedNode,
  graphSearch,
  setGraphSearch,
  entityGraphConfig,
  graphApiData,
  linkedCases,
  setEntityDrawer,
}: Props) {

  return (
    <div className="space-y-4">
      {/* Statistics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#121B2A] border border-[#223047] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider">Total Entities</p>
              <p className="text-2xl font-bold text-[#00B8FF] mt-1">{nodes.length}</p>
            </div>
            <Network className="w-8 h-8 text-[#00B8FF]/30" />
          </div>
        </div>
        <div className="bg-[#121B2A] border border-[#223047] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider">High Risk Entities</p>
              <p className="text-2xl font-bold text-red-400 mt-1">
                {caseData.entities ? caseData.entities.filter((e: Entity) => e.riskLevel === 'High').length : 0}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400/30" />
          </div>
        </div>
        <div className="bg-[#121B2A] border border-[#223047] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider">Cross-Case Links</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{linkedCases?.total_linked_cases || 0}</p>
            </div>
            <Link2 className="w-8 h-8 text-amber-400/30" />
          </div>
        </div>
        <div className="bg-[#121B2A] border border-[#223047] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider">Avg. Confidence</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {caseData.entities && caseData.entities.length > 0 
                  ? Math.round(caseData.entities.reduce((acc: number, e: Entity) => acc + (graphApiData[e.value]?.confidence || 75), 0) / caseData.entities.length)
                  : 0}%
              </p>
            </div>
            <Shield className="w-8 h-8 text-emerald-400/30" />
          </div>
        </div>
      </div>

      {/* Main Graph Container */}
      <div className="flex flex-col xl:flex-row gap-4" style={{ minHeight: '700px' }}>
        {/* Graph Panel - 75% */}
        <div className="flex-1 xl:w-3/4 bg-[#121B2A] border border-[#223047] rounded-xl overflow-hidden" style={{ height: '700px' }}>
          {/* Graph Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b border-[#223047] bg-[#0B1220] gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                <Network className="w-4 h-4 text-[#00B8FF]" />
                Entity Relationship Graph
              </h3>
              <p className="text-xs text-[#98A2B3] mt-0.5">
                {nodes.length} nodes • {edges.length} connections • {new Set(caseData.entities?.map((e: Entity) => e.type) || []).size} types
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#98A2B3]" />
                <input 
                  type="text" 
                  value={graphSearch} 
                  onChange={(e) => setGraphSearch(e.target.value)} 
                  placeholder="Search entities..."
                  className="pl-8 pr-3 py-1.5 w-44 bg-[#0B1220] border border-[#223047] rounded-lg text-xs text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Legend Bar */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[#223047] bg-[#0B1220]/50 overflow-x-auto">
            <span className="text-[10px] text-slate-600 uppercase tracking-wider font-medium shrink-0">Legend:</span>
            {[
              { type: 'Victim', color: '#3b82f6', icon: '👤' },
              { type: 'Phone', color: '#f59e0b', icon: '📞' },
              { type: 'UPI', color: '#8b5cf6', icon: '💳' },
              { type: 'Bank', color: '#10b981', icon: '🏦' },
              { type: 'Email', color: '#ec4899', icon: '📧' },
              { type: 'Telegram', color: '#6366f1', icon: '✈️' },
              { type: 'Website', color: '#ef4444', icon: '🌐' },
              { type: 'IP', color: '#78716c', icon: '🖥️' },
            ].map(({ type, color, icon }) => (
              <div key={type} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.02] border border-white/[0.04] shrink-0">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-[#98A2B3]">{icon} {type}</span>
              </div>
            ))}
          </div>

          {/* ReactFlow Graph */}
          <div style={{ width: '100%', height: 'calc(100% - 110px)' }}>
            {nodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-20 h-20 rounded-2xl bg-[#0B1220]/30 border border-[#223047]/50 flex items-center justify-center mb-4">
                  <Network className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-[#98A2B3] mb-2">No Entity Graph Available</h3>
                <p className="text-sm text-[#98A2B3] max-w-md">
                  Entity relationships will appear here once entities are extracted from evidence and case data.
                </p>
              </div>
            ) : (
              <ReactFlow 
                nodes={nodes} 
                edges={edges} 
                onNodesChange={onNodesChange} 
                onEdgesChange={onEdgesChange} 
                onNodeClick={onNodeClick}
                fitView 
                fitViewOptions={{ padding: 0.15, minZoom: 0.5, maxZoom: 1.5 }} 
                proOptions={{ hideAttribution: true }}
                minZoom={0.3}
                maxZoom={2}
                defaultEdgeOptions={{
                  type: 'smoothstep',
                  animated: false,
                  style: { strokeWidth: 1.5 }
                }}
              >
                <Controls 
                  className="!bg-[#121B2A] !border-[#223047] !shadow-xl" 
                  showInteractive={false}
                />
                <MiniMap 
                  className="!bg-[#121B2A] !border-[#223047] !shadow-xl" 
                  nodeColor={(n) => {
                    const entityType = String(n.data.entityType);
                    const cfg = entityGraphConfig[entityType] || entityGraphConfig['IP Address'];
                    return cfg.border;
                  }}
                  maskColor="rgba(10, 17, 32, 0.8)"
                  style={{ width: 120, height: 80 }}
                />
                <Background 
                  gap={20} 
                  size={1} 
                  color="#1e293b" 
                />
              </ReactFlow>
            )}
          </div>
        </div>

        {/* Entity Inspector Panel - 25% */}
        <div className="xl:w-1/4 shrink-0 bg-[#121B2A] border border-[#223047] rounded-xl overflow-hidden" style={{ height: '700px' }}>
          <div className="h-full flex flex-col">
            {/* Inspector Header */}
            <div className="px-4 py-3 border-b border-[#223047] bg-[#0B1220]">
              <h4 className="text-xs font-semibold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-3.5 h-3.5" />
                Entity Inspector
              </h4>
            </div>

            {/* Inspector Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedNode ? (() => {
                const ent = caseData.entities?.find((e: Entity) => e.id === selectedNode.id);
                
                // Victim Node
                if (!ent) {
                  return (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border border-cyan-500/30">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                            <User className="w-5 h-5 text-[#00B8FF]" />
                          </div>
                          <div>
                            <p className="text-[10px] text-[#00B8FF] font-semibold uppercase tracking-wider">Victim</p>
                            <p className="text-sm text-[#F8FAFC] font-medium">{caseData.victim.name}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-[#98A2B3]" />
                            <span className="text-[#F8FAFC]">{caseData.victim.contact}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-[#98A2B3]" />
                            <span className="text-[#F8FAFC]">{caseData.victim.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-[#0B1220] border border-[#223047] rounded-lg">
                          <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-1">Connected</p>
                          <p className="text-xl font-bold text-[#F8FAFC]">{caseData.entities?.length || 0}</p>
                        </div>
                        <div className="p-3 bg-[#0B1220] border border-[#223047] rounded-lg">
                          <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-1">Total Loss</p>
                          <p className="text-sm font-bold text-red-400">{formatINR(caseData.amountLost)}</p>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Entity Node
                const gCfg = entityGraphConfig[ent.type] || entityGraphConfig['IP Address'];
                const connectedCount = ent.connectedEntities?.length || 0;
                const evidenceCount = caseData.evidence?.filter((ev: Evidence) => 
                  ev.description?.includes(ent.value) || (ev as any).analysis?.includes(ent.value)
                ).length || 0;

                return (
                  <div className="space-y-4">
                    {/* Entity Value Card */}
                    <div className="p-4 rounded-xl border" style={{ 
                      borderColor: gCfg.border + '40', 
                      background: `linear-gradient(135deg, ${gCfg.color}33, ${gCfg.color}11)` 
                    }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: gCfg.border }}>
                          {ent.type}
                        </span>
                        {ent.riskLevel === 'High' && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            HIGH RISK
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-mono text-[#F8FAFC] break-all leading-relaxed">{ent.value}</p>
                    </div>

                    {/* Risk & Confidence */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[10px] text-[#F8FAFC]0 uppercase tracking-wider">Risk Score</p>
                          <span className={`text-xs font-bold ${
                            ent.riskLevel === 'High' ? 'text-red-400' :
                            ent.riskLevel === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {ent.riskScore || 50}/100
                          </span>
                        </div>
                        <RiskBar level={ent.riskLevel} score={ent.riskScore} />
                      </div>

                      {graphApiData[ent.value] && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[10px] text-[#F8FAFC]0 uppercase tracking-wider">Confidence</p>
                            <span className="text-xs font-bold text-[#00B8FF]">{graphApiData[ent.value].confidence}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full transition-all duration-500"
                              style={{ width: `${graphApiData[ent.value].confidence}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 bg-[#0B1220] border border-[#223047] rounded-lg">
                        <p className="text-[9px] text-[#98A2B3] uppercase tracking-wider mb-0.5">Connected</p>
                        <p className="text-lg font-bold text-[#F8FAFC]">{connectedCount}</p>
                      </div>
                      <div className="p-2.5 bg-[#0B1220] border border-[#223047] rounded-lg">
                        <p className="text-[9px] text-[#98A2B3] uppercase tracking-wider mb-0.5">Evidence</p>
                        <p className="text-lg font-bold text-[#F8FAFC]">{evidenceCount}</p>
                      </div>
                      <div className="p-2.5 bg-[#0B1220] border border-[#223047] rounded-lg">
                        <p className="text-[9px] text-[#98A2B3] uppercase tracking-wider mb-0.5">Cases</p>
                        <p className="text-lg font-bold text-amber-400">{graphApiData[ent.value]?.related_case_count ?? ent.associatedCases}</p>
                      </div>
                      <div className="p-2.5 bg-[#0B1220] border border-[#223047] rounded-lg">
                        <p className="text-[9px] text-[#98A2B3] uppercase tracking-wider mb-0.5">Label</p>
                        <p className="text-[10px] font-medium text-[#F8FAFC] truncate">{ent.label}</p>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2.5 bg-[#0B1220] border border-[#223047] rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          <span className="text-[10px] text-[#98A2B3] uppercase">First Seen</span>
                        </div>
                        <span className="text-xs text-[#F8FAFC] font-mono">{ent.firstSeen}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-[#0B1220] border border-[#223047] rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span className="text-[10px] text-[#98A2B3] uppercase">Last Seen</span>
                        </div>
                        <span className="text-xs text-[#F8FAFC] font-mono">{ent.lastSeen}</span>
                      </div>
                    </div>

                    {/* Connected Entities */}
                    {ent.connectedEntities && ent.connectedEntities.length > 0 && (
                      <div>
                        <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-2">Connected Entities</p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {ent.connectedEntities.slice(0, 5).map((cv: string, idx: number) => (
                            <div key={idx} className="text-[10px] font-mono text-[#98A2B3] p-2 bg-[#0B1220] border border-[#223047] rounded truncate">
                              {cv}
                            </div>
                          ))}
                          {ent.connectedEntities.length > 5 && (
                            <p className="text-[9px] text-slate-600 text-center py-1">
                              +{ent.connectedEntities.length - 5} more
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <button 
                      onClick={() => setEntityDrawer(ent)} 
                      className="w-full py-2 px-3 text-xs text-[#00B8FF] border border-cyan-500/30 rounded-lg hover:bg-[#29C5FF]/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Open Full Analysis
                    </button>
                  </div>
                );
              })() : (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#0B1220]/30 border border-[#223047]/50 flex items-center justify-center mb-4">
                    <MousePointer className="w-8 h-8 text-slate-600" />
                  </div>
                  <h4 className="text-sm font-semibold text-[#98A2B3] mb-1">Select an Entity</h4>
                  <p className="text-xs text-slate-600">
                    Click any node in the graph to view detailed information
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
