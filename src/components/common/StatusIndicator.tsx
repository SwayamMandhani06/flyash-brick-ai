import React from 'react';

export type SystemStatusType = 'operational' | 'in-progress' | 'warning' | 'error' | 'demo';

interface StatusIndicatorProps {
  status: SystemStatusType;
  label?: string;
  pulse?: boolean;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  pulse = true,
  size = 'md',
  style,
}) => {
  const getColor = () => {
    switch (status) {
      case 'operational':
        return 'var(--status-success)';
      case 'in-progress':
        return 'var(--accent-primary)';
      case 'warning':
        return 'var(--status-warning)';
      case 'error':
        return 'var(--status-danger)';
      case 'demo':
        return 'var(--accent-secondary)';
      default:
        return 'var(--text-tertiary)';
    }
  };

  const dotSize = size === 'sm' ? '6px' : '8px';
  const color = getColor();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: size === 'sm' ? '0.72rem' : '0.78rem',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-secondary)',
        ...style,
      }}
    >
      <span
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          backgroundColor: color,
          flexShrink: 0,
        }}
        className={pulse ? 'animate-pulse-subtle' : ''}
      />
      {label && <span>{label}</span>}
    </span>
  );
};
