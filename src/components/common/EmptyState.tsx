import React from 'react';
import { Database, Plus } from 'lucide-react';
import { Button } from './Button';
import { GlassPanel } from './GlassPanel';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = <Database size={36} />,
  actionLabel,
  onAction,
}) => {
  return (
    <GlassPanel
      padding="lg"
      style={{
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-12) var(--space-6)',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--bg-surface-subtle)',
          color: 'var(--text-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-4)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {icon}
      </div>
      <h4 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>{title}</h4>
      <p style={{ maxWidth: '440px', margin: '0 auto var(--space-6)', fontSize: '0.92rem' }}>
        {description}
      </p>
      {actionLabel && (
        <Button variant="primary" icon={<Plus size={16} />} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </GlassPanel>
  );
};
