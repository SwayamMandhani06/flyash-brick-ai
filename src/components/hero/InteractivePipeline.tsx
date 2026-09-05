import React, { useState } from 'react';
import { BookOpen, FileSpreadsheet, Database, Cpu, Sliders, CheckCircle2 } from 'lucide-react';

interface PipelineNodeData {
  id: string;
  stepNumber: string;
  title: string;
  microSummary: string;
  detail: string;
  icon: React.ReactNode;
  accent: string;
  sampleMetric: string;
}

export const InteractivePipeline: React.FC = () => {
  const [activeNodeId, setActiveNodeId] = useState<string>('node-prediction');

  const nodes: PipelineNodeData[] = [
    {
      id: 'node-papers',
      stepNumber: '01',
      title: 'Research Papers',
      microSummary: 'Experimental literature',
      detail: 'Heterogeneous journal publications (Elsevier, Springer, ASCE) containing non-standardized mix tables.',
      icon: <BookOpen size={16} />,
      accent: 'var(--accent-mineral)',
      sampleMetric: '42+ papers catalogued',
    },
    {
      id: 'node-docai',
      stepNumber: '02',
      title: 'Document Intelligence',
      microSummary: 'Table detection + extraction',
      detail: 'Bounding-box heuristics and OCR parsing convert published mix matrices into raw chemical constituents.',
      icon: <FileSpreadsheet size={16} />,
      accent: 'var(--accent-secondary)',
      sampleMetric: '380+ rows parsed',
    },
    {
      id: 'node-dataset',
      stepNumber: '03',
      title: 'Benchmark Dataset',
      microSummary: 'Standardized experimental records',
      detail: 'Dry-solid mass balance (100% sum check) and standardization conforming to IS 12894 and IS 3812 guidelines.',
      icon: <Database size={16} />,
      accent: 'var(--accent-primary)',
      sampleMetric: '18 verified benchmarks',
    },
    {
      id: 'node-prediction',
      stepNumber: '04',
      title: 'AI Prediction',
      microSummary: 'Strength + water absorption',
      detail: 'Multi-target surrogate models forecasting 28-day compressive strength and water absorption in milliseconds.',
      icon: <Cpu size={16} />,
      accent: 'var(--accent-primary)',
      sampleMetric: 'Dual-target inference',
    },
    {
      id: 'node-optimization',
      stepNumber: '05',
      title: 'Mix Optimization',
      microSummary: 'Feasible manufacturing settings',
      detail: 'Constrained Pareto frontier exploration maximizing fly ash utilization while meeting required building codes.',
      icon: <Sliders size={16} />,
      accent: 'var(--accent-secondary)',
      sampleMetric: 'Up to 72% fly ash ratio',
    },
    {
      id: 'node-decision',
      stepNumber: '06',
      title: 'Manufacturing Decision',
      microSummary: 'Actionable recommendation',
      detail: 'Production batch sheet specifying pan mixer weights, hydraulic compaction pressure, and water dosage.',
      icon: <CheckCircle2 size={16} />,
      accent: 'var(--status-success)',
      sampleMetric: 'Ready-to-batch recipe',
    },
  ];

  const activeNode = nodes.find((n) => n.id === activeNodeId) || nodes[3];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '560px',
        margin: '0 auto',
      }}
    >
      {/* Visual System Header Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 'var(--space-3)',
          borderBottom: '1px solid var(--border-hairline)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-primary)',
            }}
            className="animate-pulse-subtle"
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-tertiary)',
            }}
          >
            INTELLIGENCE PIPELINE GRAPH
          </span>
        </div>
        <span
          style={{
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
          }}
        >
          Hover node to inspect
        </span>
      </div>

      {/* Living Interactive Pipeline Nodes */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          position: 'relative',
        }}
      >
        {nodes.map((node, index) => {
          const isActive = node.id === activeNodeId;
          const isLast = index === nodes.length - 1;

          return (
            <div key={node.id} style={{ position: 'relative' }}>
              <div
                onMouseEnter={() => setActiveNodeId(node.id)}
                onClick={() => setActiveNodeId(node.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveNodeId(node.id); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isActive
                    ? 'var(--bg-surface)'
                    : 'transparent',
                  border: isActive
                    ? '1px solid var(--border-medium)'
                    : '1px solid var(--border-hairline)',
                  boxShadow: isActive ? 'var(--shadow-md)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                  zIndex: 2,
                }}
                className="pipeline-node-strip"
              >
                {/* Node Number & Icon & Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                      width: '20px',
                    }}
                  >
                    {node.stepNumber}
                  </span>

                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isActive
                        ? 'var(--accent-primary-subtle)'
                        : 'var(--bg-surface-subtle)',
                      color: isActive ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 200ms ease',
                    }}
                  >
                    {node.icon}
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '0.92rem',
                        fontWeight: isActive ? 700 : 600,
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        lineHeight: 1.2,
                      }}
                    >
                      {node.title}
                    </div>
                  </div>
                </div>

                {/* Right context pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: isActive
                        ? 'var(--accent-primary-subtle)'
                        : 'var(--bg-surface-subtle)',
                      color: isActive
                        ? 'var(--accent-primary)'
                        : 'var(--text-muted)',
                      transition: 'all 200ms ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    &rarr; {node.microSummary}
                  </span>
                </div>
              </div>

              {/* Connecting animated conduit line between nodes */}
              {!isLast && (
                <div
                  style={{
                    height: '8px',
                    width: '2px',
                    backgroundColor: isActive ? 'var(--accent-primary)' : 'var(--border-medium)',
                    marginLeft: '44px',
                    transition: 'background-color 200ms ease',
                    position: 'relative',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Active Node Telemetry Capsule (Compact & Elegant, not a giant card) */}
      <div
        style={{
          marginTop: 'var(--space-4)',
          padding: 'var(--space-4) var(--space-5)',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 200ms ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--accent-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              STAGE {activeNode.stepNumber} INSIGHT
            </span>
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: 'var(--text-secondary)',
            }}
          >
            {activeNode.sampleMetric}
          </span>
        </div>
        <p
          style={{
            fontSize: '0.86rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {activeNode.detail}
        </p>
      </div>

      <style>{`
        .pipeline-node-strip:hover {
          background-color: var(--bg-surface) !important;
          border-color: var(--border-medium) !important;
        }
      `}</style>
    </div>
  );
};
