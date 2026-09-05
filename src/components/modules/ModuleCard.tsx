import React from 'react';
import { Link } from 'react-router-dom';
import { GlassPanel } from '../common/GlassPanel';
import { ArrowRight } from 'lucide-react';

export interface ModuleCardProps {
  number: string;
  title: string;
  tagline: string;
  description: string;
  icon: React.ReactNode;
  accentColor: 'emerald' | 'teal' | 'amber' | 'blue';
  linkTo: string;
  previewElement: React.ReactNode;
  features: string[];
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  number,
  title,
  tagline,
  description,
  icon,
  accentColor,
  linkTo,
  previewElement,
  features,
}) => {
  const getAccentVar = () => {
    switch (accentColor) {
      case 'teal': return 'var(--accent-secondary)';
      case 'amber': return 'var(--accent-mineral)';
      case 'blue': return 'var(--status-info)';
      case 'emerald':
      default: return 'var(--accent-primary)';
    }
  };

  return (
    <GlassPanel
      elevation="low"
      padding="lg"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        transition: 'transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base)',
      }}
      className="module-card-interactive"
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface-subtle)',
            color: getAccentVar(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {icon}
        </div>
        <span
          className="font-mono"
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: 'var(--text-muted)',
            opacity: 0.7,
          }}
        >
          {number}
        </span>
      </div>

      {/* Title & Tagline */}
      <div style={{ marginBottom: 'var(--space-3)' }}>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: getAccentVar(),
          }}
        >
          {tagline}
        </span>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>
          {title}
        </h3>
      </div>

      <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-6)' }}>
        {description}
      </p>

      {/* Bespoke Interactive Preview Box for this Engine */}
      <div
        style={{
          marginBottom: 'var(--space-6)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-surface-subtle)',
          border: '1px solid var(--border-subtle)',
          padding: 'var(--space-4)',
        }}
      >
        {previewElement}
      </div>

      {/* Feature Bullet Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        {features.map((feat, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: getAccentVar() }} />
            <span>{feat}</span>
          </div>
        ))}
      </div>

      {/* Link to Dedicated Module */}
      <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
        <Link
          to={linkTo}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: '0.88rem',
            fontWeight: 600,
            color: getAccentVar(),
            transition: 'gap 150ms ease',
          }}
          className="module-cta-link"
        >
          <span>Launch {title}</span>
          <ArrowRight size={15} />
        </Link>
      </div>

      <style>{`
        .module-card-interactive:hover {
          transform: translateY(-3px);
          border-color: var(--border-medium);
          box-shadow: var(--shadow-lg);
        }
        .module-cta-link:hover {
          gap: var(--space-3) !important;
        }
      `}</style>
    </GlassPanel>
  );
};
