import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Database, Cpu, Sliders, Home, ArrowLeft } from 'lucide-react';

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
  badge = 'Engine Active',
  badgeVariant = 'emerald',
  actions,
}) => {
  const location = useLocation();

  const navTabs = [
    { path: '/platform', label: 'Overview Hub', icon: <Home size={14} />, code: 'HUB' },
    { path: '/platform/extraction', label: '01. Extraction', icon: <BookOpen size={14} />, code: 'ETL' },
    { path: '/platform/dataset', label: '02. Benchmark Data', icon: <Database size={14} />, code: 'DATA' },
    { path: '/platform/prediction', label: '03. AI Prediction', icon: <Cpu size={14} />, code: 'SURROGATE' },
    { path: '/platform/optimization', label: '04. Mix Optimizer', icon: <Sliders size={14} />, code: 'PARETO' },
  ];

  return (
    <div style={{ minHeight: 'calc(100vh - 120px)', padding: 'var(--space-5) 0 var(--space-16)' }}>
      <div className="container">
        {/* Workstation Technical Telemetry Header */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
            padding: 'var(--space-2) 0 var(--space-4)',
            borderBottom: '1px solid var(--border-hairline)',
            marginBottom: 'var(--space-5)',
            fontSize: '0.76rem',
            color: 'var(--text-tertiary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--text-tertiary)',
                textDecoration: 'none',
                transition: 'color var(--transition-fast)',
              }}
              className="hover-text-primary"
            >
              <ArrowLeft size={13} />
              <span>Public Website</span>
            </Link>
            <span>/</span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Workstation Suite</span>
            <span>/</span>
            <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{badge}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontFamily: 'var(--font-mono)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--status-success)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Status: Operational</span>
            </span>
            <span>•</span>
            <span style={{ color: 'var(--text-tertiary)' }}>Corpus: 18 Mixes</span>
            <span>•</span>
            <span style={{ color: 'var(--text-tertiary)' }}>Context: IS 12894 / IS 3812</span>
          </div>
        </div>

        {/* Page Title & Action Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-5)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
              <span className={`badge badge-${badgeVariant}`} style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                {badge}
              </span>
            </div>
            <h1
              style={{
                fontSize: 'clamp(1.5rem, 2.2vw + 0.5rem, 2rem)',
                fontWeight: 800,
                letterSpacing: '-0.025em',
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                style={{
                  fontSize: '0.88rem',
                  color: 'var(--text-secondary)',
                  marginTop: 'var(--space-1)',
                  maxWidth: '780px',
                  lineHeight: 1.5,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              {actions}
            </div>
          )}
        </div>

        {/* Streamlined Sub-Navigation Strip */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-1)',
            overflowX: 'auto',
            paddingBottom: '2px',
            marginBottom: 'var(--space-6)',
            borderBottom: '1px solid var(--border-hairline)',
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
                  gap: '6px',
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                  fontSize: '0.82rem',
                  fontWeight: isTabActive ? 700 : 500,
                  color: isTabActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  backgroundColor: isTabActive ? 'var(--bg-surface)' : 'transparent',
                  border: isTabActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
                  borderBottom: isTabActive ? '1px solid var(--bg-surface)' : 'none',
                  marginBottom: isTabActive ? '-1px' : '0',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  transition: 'all 140ms ease',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Child Module Content */}
        {children}
      </div>
    </div>
  );
};
