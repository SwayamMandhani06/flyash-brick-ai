import React from 'react';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Executing computational pipeline...',
  subMessage,
  size = 'md',
  className = '',
  style,
}) => {
  const spinnerDimensions = size === 'sm' ? 24 : size === 'lg' ? 48 : 36;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: size === 'sm' ? 'var(--space-4)' : 'var(--space-8)',
        textAlign: 'center',
        ...style,
      }}
      role="status"
      aria-live="polite"
    >
      <div
        style={{
          width: `${spinnerDimensions}px`,
          height: `${spinnerDimensions}px`,
          borderRadius: '50%',
          border: '2px solid var(--border-medium)',
          borderTopColor: 'var(--accent-primary)',
          animation: 'spin 0.85s linear infinite',
          marginBottom: 'var(--space-3)',
        }}
      />
      <div style={{ fontSize: size === 'sm' ? '0.8rem' : '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
        {message}
      </div>
      {subMessage && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px', maxWidth: '380px' }}>
          {subMessage}
        </div>
      )}
    </div>
  );
};
