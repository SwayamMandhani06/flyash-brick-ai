import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme, type Theme } from '../../context/ThemeContext';

export const ThemeSwitcher: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { theme, setTheme } = useTheme();

  const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light Theme', icon: <Sun size={14} /> },
    { value: 'system', label: 'System Mode', icon: <Laptop size={14} /> },
    { value: 'dark', label: 'Dark Theme', icon: <Moon size={14} /> },
  ];

  return (
    <div
      role="group"
      aria-label="Color theme selector"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px',
        backgroundColor: 'var(--bg-surface-subtle)',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border-subtle)',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {options.map((opt) => {
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            title={opt.label}
            aria-label={opt.label}
            aria-pressed={isActive}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: compact ? '4px 8px' : '5px 10px',
              gap: '5px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
              backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
              boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
              border: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
              transition: 'all 200ms cubic-bezier(0.2, 0, 0, 1)',
              cursor: 'pointer',
              zIndex: 1,
            }}
          >
            {opt.icon}
            {!compact && <span style={{ textTransform: 'capitalize' }}>{opt.value}</span>}
          </button>
        );
      })}
    </div>
  );
};
