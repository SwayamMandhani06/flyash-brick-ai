import React from 'react';
import { Check, Loader2, Circle } from 'lucide-react';

export interface StepItem {
  id: string | number;
  label: string;
  description?: string;
}

interface ProcessingStepperProps {
  steps: StepItem[];
  currentStepIndex: number;
  isComplete?: boolean;
}

export const ProcessingStepper: React.FC<ProcessingStepperProps> = ({
  steps,
  currentStepIndex,
  isComplete = false,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%' }}>
      {steps.map((step, idx) => {
        const isDone = isComplete || idx < currentStepIndex;
        const isActive = !isComplete && idx === currentStepIndex;
        const isPending = !isComplete && idx > currentStepIndex;

        return (
          <div
            key={step.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isActive
                ? 'var(--accent-primary-subtle)'
                : isDone
                ? 'var(--bg-surface-subtle)'
                : 'transparent',
              border: isActive
                ? '1px solid var(--border-accent)'
                : '1px solid var(--border-subtle)',
              transition: 'all var(--transition-base)',
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '1px',
                backgroundColor: isDone
                  ? 'var(--status-success)'
                  : isActive
                  ? 'var(--accent-primary)'
                  : 'var(--bg-surface)',
                color: isDone || isActive ? '#ffffff' : 'var(--text-muted)',
                border: isPending ? '1px solid var(--border-medium)' : 'none',
              }}
            >
              {isDone ? (
                <Check size={14} strokeWidth={3} />
              ) : isActive ? (
                <Loader2
                  size={14}
                  style={{ animation: 'spin 1s linear infinite' }}
                />
              ) : (
                <Circle size={10} strokeWidth={2} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isPending ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{step.label}</span>
                {isActive && (
                  <span
                    className="badge badge-emerald"
                    style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}
                  >
                    Processing
                  </span>
                )}
                {isDone && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--status-success)',
                      fontWeight: 600,
                    }}
                  >
                    Done
                  </span>
                )}
              </div>
              {step.description && (
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    marginTop: '2px',
                  }}
                >
                  {step.description}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
