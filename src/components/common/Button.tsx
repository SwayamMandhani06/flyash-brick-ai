import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'mineral';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  style,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--accent-primary)',
          color: '#ffffff',
          border: '1px solid transparent',
          boxShadow: '0 2px 8px var(--accent-primary-subtle)',
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--accent-secondary)',
          color: '#ffffff',
          border: '1px solid transparent',
          boxShadow: '0 2px 8px var(--accent-secondary-subtle)',
        };
      case 'mineral':
        return {
          backgroundColor: 'var(--accent-mineral)',
          color: '#ffffff',
          border: '1px solid transparent',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-medium)',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--text-secondary)',
          border: '1px solid transparent',
        };
      default:
        return {};
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return {
          padding: '0.4rem 0.85rem',
          fontSize: '0.82rem',
          borderRadius: 'var(--radius-sm)',
          gap: '0.4rem',
        };
      case 'lg':
        return {
          padding: '0.85rem 1.75rem',
          fontSize: '1.05rem',
          borderRadius: 'var(--radius-md)',
          gap: '0.65rem',
        };
      case 'md':
      default:
        return {
          padding: '0.6rem 1.25rem',
          fontSize: '0.92rem',
          borderRadius: 'var(--radius-sm)',
          gap: '0.5rem',
        };
    }
  };

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.65 : 1,
    transition: 'all var(--transition-fast)',
    whiteSpace: 'nowrap',
    letterSpacing: '-0.01em',
    userSelect: 'none',
    ...getVariantStyles(),
    ...getSizeStyles(),
    ...style,
  };

  return (
    <button
      style={baseStyle}
      disabled={disabled || isLoading}
      className={`btn-interactive ${className}`}
      {...props}
    >
      {isLoading && (
        <span
          style={{
            display: 'inline-block',
            width: '14px',
            height: '14px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      )}
      {!isLoading && icon && iconPosition === 'left' && <span>{icon}</span>}
      <span>{children}</span>
      {!isLoading && icon && iconPosition === 'right' && <span>{icon}</span>}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .btn-interactive:hover:not(:disabled) {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }
        .btn-interactive:active:not(:disabled) {
          transform: translateY(0);
          filter: brightness(0.96);
        }
      `}</style>
    </button>
  );
};
