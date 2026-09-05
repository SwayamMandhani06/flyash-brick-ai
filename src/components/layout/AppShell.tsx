import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Database, Cpu, Sliders, ChevronRight, Home } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'emerald' | 'teal' | 'amber' | 'subtle';
  actions?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  title,
  subtitle,
  badge = 'Engine Workbench',
  badgeVariant = 'emerald',
  actions,
}) => {
  const location = useLocation();

  const navTabs = [
    { path: '/platform', label: 'Overview', icon: <Home size={15} /> },
    { path: '/platform/extraction', label: '01. Literature Extraction', icon: <BookOpen size={15} /> },
    { path: '/platform/dataset', label: '02. Benchmark Dataset', icon: <Database size={15} /> },
    { path: '/platform/prediction', label: '03. AI Quality Prediction', icon: <Cpu size={15} /> },
    { path: '/platform/optimization', label: '04. Mix Optimizer', icon: <Sliders size={15} /> },
  ];

  return (
    <div style={{ minHeight: 'calc(100vh - 140px)', padding: 'var(--space-8) 0 var(--space-20)' }}>
      <div className="container">
        {/* Breadcrumb Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: '0.82rem',
            color: 'var(--text-tertiary)',
            marginBottom: 'var(--space-6)',
          }}
        >
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-tertiary)' }}>
            <Home size={14} /> Home
          </Link>
          <ChevronRight size={14} />
          <Link to="/platform" style={{ color: 'var(--text-tertiary)' }}>Platform</Link>
          {location.pathname !== '/platform' && (
            <>
              <ChevronRight size={14} />
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{title}</span>
            </>
          )}
        </div>

        {/* Workbench Header */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-8)',
          }}
        >
          <div>
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <span className={`badge badge-${badgeVariant}`}>{badge}</span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.75rem, 2.5vw + 0.5rem, 2.35rem)', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: 'var(--space-1)', maxWidth: '720px' }}>
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              {actions}
            </div>
          )}
        </div>

        {/* Modular Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            overflowX: 'auto',
            paddingBottom: 'var(--space-2)',
            marginBottom: 'var(--space-8)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {navTabs.map((tab) => {
            const isTabActive = location.pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: '0.55rem 1rem',
                  borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                  fontSize: '0.86rem',
                  fontWeight: isTabActive ? 600 : 500,
                  color: isTabActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  backgroundColor: isTabActive ? 'var(--bg-surface)' : 'transparent',
                  border: isTabActive ? '1px solid var(--border-medium)' : '1px solid transparent',
                  borderBottom: isTabActive ? '1px solid var(--bg-surface)' : 'none',
                  marginBottom: isTabActive ? '-1px' : '0',
                  whiteSpace: 'nowrap',
                  transition: 'all 160ms ease',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Child Workbench Content */}
        {children}
      </div>
    </div>
  );
};
