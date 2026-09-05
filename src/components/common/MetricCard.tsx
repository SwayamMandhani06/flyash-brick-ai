import React from 'react';
import { GlassPanel } from './GlassPanel';
import { AnimatedCounter } from './AnimatedCounter';

interface MetricCardProps {
  label: string;
  value: number;
  decimals?: number;
  unit?: string;
  prefix?: string;
  sublabel?: string;
  icon?: React.ReactNode;
  tag?: string;
  tagVariant?: 'emerald' | 'teal' | 'amber' | 'subtle';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  decimals = 0,
  unit,
  prefix = '',
  sublabel,
  icon,
  tag,
  tagVariant = 'emerald',
}) => {
  return (
    <GlassPanel padding="md" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </span>
        {icon && <span style={{ color: 'var(--accent-primary)', opacity: 0.85 }}>{icon}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', marginTop: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
        <span style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
          <AnimatedCounter end={value} decimals={decimals} prefix={prefix} />
        </span>
        {unit && (
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-tertiary)', fontFeatureSettings: "'tnum' 1" }}>
            {unit}
          </span>
        )}
      </div>

      {(sublabel || tag) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-subtle)', gap: 'var(--space-2)' }}>
          {sublabel && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {sublabel}
            </span>
          )}
          {tag && (
            <span className={`badge badge-${tagVariant}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
              {tag}
            </span>
          )}
        </div>
      )}
    </GlassPanel>
  );
};
