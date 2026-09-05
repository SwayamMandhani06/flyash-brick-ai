import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { GlassPanel } from './GlassPanel';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  code?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Processing Error',
  message,
  onRetry,
  code,
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
        padding: 'var(--space-10) var(--space-6)',
        border: '1px solid var(--status-danger-bg)',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--status-danger-bg)',
          color: 'var(--status-danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-4)',
        }}
      >
        <AlertCircle size={30} />
      </div>
      <h4 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
        {title}
      </h4>
      <p style={{ maxWidth: '480px', margin: '0 auto var(--space-4)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        {message}
      </p>
      {code && (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'var(--bg-surface-subtle)',
            color: 'var(--text-tertiary)',
            marginBottom: 'var(--space-5)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          ERR_CODE: {code}
        </div>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={onRetry}>
          Retry Operation
        </Button>
      )}
    </GlassPanel>
  );
};
