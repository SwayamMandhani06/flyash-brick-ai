import React, { useState } from 'react';
import { PIPELINE_STAGES } from '../../data/pipelineStages';
import { GlassPanel } from '../common/GlassPanel';
import { BookOpen, FileSpreadsheet, Database, Cpu, Sliders, CheckCircle2, Activity } from 'lucide-react';

export const InteractivePipeline: React.FC = () => {
  const [activeStageId, setActiveStageId] = useState<string>('stage-prediction');

  const activeStage = PIPELINE_STAGES.find((s) => s.id === activeStageId) || PIPELINE_STAGES[3];

  const getStageIcon = (id: string, size = 18) => {
    switch (id) {
      case 'stage-literature': return <BookOpen size={size} />;
      case 'stage-standardization': return <FileSpreadsheet size={size} />;
      case 'stage-dataset': return <Database size={size} />;
      case 'stage-prediction': return <Cpu size={size} />;
      case 'stage-optimization': return <Sliders size={size} />;
      case 'stage-decision': return <CheckCircle2 size={size} />;
      default: return <Activity size={size} />;
    }
  };

  return (
    <GlassPanel
      elevation="high"
      padding="none"
      accentBorder
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        border: '1px solid var(--border-medium)',
      }}
    >
      {/* Visual Terminal Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-5)',
          backgroundColor: 'var(--bg-surface-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '0.8rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', display: 'inline-block' }} className="animate-pulse-subtle" />
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
            INTERACTIVE PIPELINE ARCHITECTURE
          </span>
        </div>
        <span
          className="badge badge-emerald"
          style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}
        >
          Click Node to Inspect
        </span>
      </div>

      {/* Nodes Stepper Ribbon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          overflowX: 'auto',
        }}
        className="pipeline-nodes-bar"
      >
        {PIPELINE_STAGES.map((stage) => {
          const isSelected = stage.id === activeStageId;
          return (
            <button
              key={stage.id}
              onClick={() => setActiveStageId(stage.id)}
              onMouseEnter={() => setActiveStageId(stage.id)}
              aria-label={`Inspect ${stage.title}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-4) var(--space-2)',
                backgroundColor: isSelected ? 'var(--accent-primary-subtle)' : 'transparent',
                borderBottom: isSelected ? '3px solid var(--accent-primary)' : '3px solid transparent',
                borderRight: '1px solid var(--border-subtle)',
                transition: 'all 200ms ease',
                cursor: 'pointer',
                textAlign: 'center',
                gap: 'var(--space-1)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-surface-subtle)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 200ms ease',
                }}
              >
                {getStageIcon(stage.id, 16)}
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  lineHeight: 1.2,
                  marginTop: '2px',
                }}
              >
                {stage.shortTitle}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {stage.stepNumber}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Stage Telemetry Panel */}
      <div style={{ padding: 'var(--space-6)', backgroundColor: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
              <span className="badge badge-subtle font-mono">STAGE {activeStage.stepNumber}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{activeStage.scientificReference}</span>
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {activeStage.title}
            </h3>
          </div>
          <div
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--accent-primary)',
              whiteSpace: 'nowrap',
            }}
          >
            Live Simulation Ready
          </div>
        </div>

        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-6)' }}>
          {activeStage.description}
        </p>

        {/* Live Metrics Grid for this node */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-5)',
          }}
          className="stage-metrics-grid"
        >
          {activeStage.sampleMetrics.map((metric, i) => (
            <div
              key={i}
              style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.04em' }}>
                {metric.label}
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }} className="font-mono">
                {metric.value}
              </div>
              {metric.unit && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {metric.unit}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Standardized Schema Tags */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-4)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 'var(--space-2)' }}>
            Associated Feature Schema:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {activeStage.schemaFields.map((field, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {field}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .pipeline-nodes-bar {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .stage-metrics-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </GlassPanel>
  );
};
