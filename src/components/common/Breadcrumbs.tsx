import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  style?: React.CSSProperties;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, style }) => {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        fontSize: '0.78rem',
        color: 'var(--text-tertiary)',
        ...style,
      }}
    >
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          color: 'var(--text-tertiary)',
          textDecoration: 'none',
        }}
        className="hover-text-primary"
      >
        <Home size={13} />
        <span>Home</span>
      </Link>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            <ChevronRight size={13} style={{ color: 'var(--border-medium)', flexShrink: 0 }} />
            {isLast || !item.path ? (
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.label}</span>
            ) : (
              <Link
                to={item.path}
                style={{
                  color: 'var(--text-tertiary)',
                  textDecoration: 'none',
                }}
                className="hover-text-primary"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
