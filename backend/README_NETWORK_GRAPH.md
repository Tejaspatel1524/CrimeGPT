# Network Analysis Graph — Frontend Integration

## New Backend Endpoint

GET /cases/{case_id}/graph

Returns graph-ready nodes and edges with confidence scores and related case counts.

## Install React Flow

```bash
npm install @xyflow/react
```

## Component: NetworkAnalysisTab.tsx

Drop this file into your components or pages folder.

```tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeTypes,
  Handle,
  Position,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ── Entity config ──────────────────────────────────────────────────────────────

const ENTITY_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  case:      { color: '#6366f1', bg: '#eef2ff', icon: '📁', label: 'Case' },
  victim:    { color: '#f59e0b', bg: '#fffbeb', icon: '👤', label: 'Victim' },
  phone:     { color: '#10b981', bg: '#ecfdf5', icon: '📱', label: 'Phone' },
  upi:       { color: '#8b5cf6', bg: '#f5f3ff', icon: '💳', label: 'UPI ID' },
  email:     { color: '#3b82f6', bg: '#eff6ff', icon: '✉️', label: 'Email' },
  url:       { color: '#ef4444', bg: '#fef2f2', icon: '🌐', label: 'Website' },
  telegram:  { color: '#0ea5e9', bg: '#f0f9ff', icon: '✈️', label: 'Telegram' },
  instagram: { color: '#ec4899', bg: '#fdf2f8', icon: '📸', label: 'Instagram' },
  bank:      { color: '#f97316', bg: '#fff7ed', icon: '🏦', label: 'Bank Account' },
  ifsc:      { color: '#14b8a6', bg: '#f0fdfa', icon: '🔢', label: 'IFSC Code' },
  amount:    { color: '#84cc16', bg: '#f7fee7', icon: '₹',  label: 'Amount' },
};

const getConfig = (type: string) =>
  ENTITY_CONFIG[type] ?? { color: '#64748b', bg: '#f8fafc', icon: '🔷', label: type };

// ── Custom node ────────────────────────────────────────────────────────────────

function EntityNode({ data }: { data: any }) {
  const cfg = getConfig(data.entity_type);
  const isCenter = data.entity_type === 'case';
  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div
        style={{
          border: `2px solid ${cfg.color}`,
          borderRadius: isCenter ? '50%' : '12px',
          background: cfg.bg,
          padding: isCenter ? '16px' : '10px 14px',
          minWidth: isCenter ? 90 : 140,
          textAlign: 'center',
          boxShadow: `0 2px 8px ${cfg.color}33`,
          cursor: 'pointer',
        }}
      >
        <div style={{ fontSize: isCenter ? 28 : 20 }}>{cfg.icon}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, marginTop: 2 }}>
          {cfg.label.toUpperCase()}
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#1e293b',
            marginTop: 3,
            maxWidth: 160,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {data.label}
        </div>
        {data.related_case_count > 1 && (
          <div
            style={{
              marginTop: 4,
              fontSize: 10,
              background: '#fee2e2',
              color: '#dc2626',
              borderRadius: 999,
              padding: '1px 6px',
              display: 'inline-block',
            }}
          >
            {data.related_case_count} cases
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </>
  );
}

const nodeTypes: NodeTypes = { entityNode: EntityNode };

// ── Layout: radial around center ──────────────────────────────────────────────

function buildLayout(rawNodes: any[], rawEdges: any[]): { nodes: Node[]; edges: Edge[] } {
  const centerNode = rawNodes.find((n) => n.entity_type === 'case');
  const others = rawNodes.filter((n) => n.entity_type !== 'case');
  const cx = 400, cy = 300;
  const radius = Math.max(200, others.length * 28);

  const nodes: Node[] = [];

  if (centerNode) {
    nodes.push({
      id: centerNode.id,
      type: 'entityNode',
      position: { x: cx, y: cy },
      data: centerNode,
    });
  }

  others.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / others.length - Math.PI / 2;
    nodes.push({
      id: n.id,
      type: 'entityNode',
      position: {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      },
      data: n,
    });
  });

  const edges: Edge[] = rawEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    style: { stroke: '#94a3b8', strokeWidth: 1.5 },
    labelStyle: { fill: '#64748b', fontSize: 10 },
    labelBgStyle: { fill: '#f8fafc', opacity: 0.8 },
    animated: false,
  }));

  return { nodes, edges };
}

// ── Side panel ────────────────────────────────────────────────────────────────

function NodePanel({ node, onClose }: { node: any; onClose: () => void }) {
  const cfg = getConfig(node.entity_type);
  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        width: 260,
        background: 'white',
        border: `2px solid ${cfg.color}`,
        borderRadius: 12,
        padding: 20,
        zIndex: 10,
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 22 }}>{cfg.icon}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
      </div>
      <div style={{ marginTop: 12 }}>
        <Row label="Type"          value={cfg.label} color={cfg.color} />
        <Row label="Value"         value={node.value} />
        <Row label="Confidence"    value={`${node.confidence}%`} />
        <Row label="Related Cases" value={node.related_case_count} />
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: any; color?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: color ?? '#1e293b', wordBreak: 'break-all' }}>{value}</div>
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        background: 'white',
        borderRadius: 10,
        padding: '10px 14px',
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        maxWidth: 380,
      }}
    >
      {Object.entries(ENTITY_CONFIG).map(([type, cfg]) => (
        <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%',
            background: cfg.color, display: 'inline-block',
          }} />
          <span style={{ color: '#475569' }}>{cfg.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  caseId: string;
  token: string;
  apiBase?: string;
}

export default function NetworkAnalysisTab({ caseId, token, apiBase = 'http://localhost:8000' }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [caseNumber, setCaseNumber] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`${apiBase}/cases/${caseId}/graph`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setCaseNumber(data.case_number);
        const { nodes: n, edges: e } = buildLayout(data.nodes, data.edges);
        setNodes(n);
        setEdges(e);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [caseId, token, apiBase]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelected(node.data);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 500 }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔄</div>
          <div>Loading entity graph…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 500 }}>
        <div style={{ textAlign: 'center', color: '#ef4444' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <div>Failed to load graph: {error}</div>
        </div>
      </div>
    );
  }

  if (nodes.length <= 1) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 500 }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🕸️</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No entities extracted yet</div>
          <div style={{ fontSize: 13 }}>Entities are extracted automatically when a case is created.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: 600, background: '#f8fafc', borderRadius: 12 }}>
      <div style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #e2e8f0' }}>
        🕸️ Network Analysis — {caseNumber}
        <span style={{ fontSize: 12, fontWeight: 400, color: '#64748b', marginLeft: 8 }}>
          {nodes.length} nodes · {edges.length} connections
        </span>
      </div>

      <div style={{ height: 'calc(100% - 48px)', position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.3}
          maxZoom={2}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} color="#e2e8f0" />
          <Controls />
          <MiniMap
            nodeColor={(n) => getConfig((n.data as any)?.entity_type).color}
            style={{ background: 'white' }}
          />
        </ReactFlow>

        {selected && <NodePanel node={selected} onClose={() => setSelected(null)} />}
        <Legend />
      </div>
    </div>
  );
}
```

## Usage in CaseDetailPage

```tsx
import NetworkAnalysisTab from './NetworkAnalysisTab';

// Inside your tab switcher:
{activeTab === 'network' && (
  <NetworkAnalysisTab
    caseId={caseId}
    token={authToken}
    apiBase="http://localhost:8000"
  />
)}
```

## Add tab button

```tsx
<button onClick={() => setActiveTab('network')}>
  🕸️ Network Analysis
</button>
```
