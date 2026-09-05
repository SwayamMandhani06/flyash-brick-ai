import React from 'react';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  elevation?: 'flat' | 'low' | 'medium' | 'high';
  bordered?: boolean;
  accentBorder?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  elevation = 'low',
  bordered = true,
  accentBorder = false,
  padding = 'md',
  className = '',
  style,
  ...props
}) => {
  const getPadding = () => {
    switch (padding) {
      case 'none': return '0';
      case 'sm': return 'var(--space-4)';
      case 'lg': return 'var(--space-8)';
      case 'md':
      default: return 'var(--space-6)';
    }
  };

  const getShadow = () => {
    switch (elevation) {
      case 'flat': return 'none';
      case 'high': return 'var(--shadow-xl)';
      case 'medium': return 'var(--shadow-lg)';
      case 'low':
      default: return 'var(--shadow-md)';
    }
  };

  const panelStyle: React.CSSProperties = {
    background: 'var(--bg-surface-translucent)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: bordered
      ? accentBorder
        ? '1px solid var(--border-accent)'
        : '1px solid var(--border-subtle)'
      : 'none',
    borderRadius: 'var(--radius-lg)',
    boxShadow: getShadow(),
    padding: getPadding(),
    transition: 'var(--transition-base)',
    position: 'relative',
    overflow: 'hidden',
    ...style,
  };

  return (
    <div
      style={panelStyle}
      className={`glass-card ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
