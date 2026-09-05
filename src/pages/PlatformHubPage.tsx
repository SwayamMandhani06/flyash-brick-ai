import React from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { GlassPanel } from '../components/common/GlassPanel';
import { Button } from '../components/common/Button';
import { BookOpen, Database, Cpu, Sliders, ArrowRight } from 'lucide-react';

export const PlatformHubPage: React.FC = () => {
  const modules = [
    {
      id: '01',
      title: 'Literature Data Extraction',
      route: '/platform/extraction',
      icon: <BookOpen size={24} />,
      color: 'var(--accent-primary)',
      badge: 'ETL Engine',
      description: 'Automated extraction of experimental mix designs and mechanical test results from unstructured research papers.',
      metrics: '380+ Raw Points Extracted',
    },
    {
      id: '02',
      title: 'Benchmark Dataset & Validator',
      route: '/platform/dataset',
      icon: <Database size={24} />,
      color: 'var(--accent-secondary)',
      badge: 'Data Corpus',
      description: 'Standardized schema matching IS 12894:2002 guidelines with stoichiometric mass balance verification and outlier filtering.',
      metrics: '18 Standardized Formulations',
    },
    {
      id: '03',
      title: 'Adaptive AI Prediction Engine',
      route: '/platform/prediction',
      icon: <Cpu size={24} />,
      color: 'var(--accent-mineral)',
      badge: 'Surrogate ML',
      description: 'Multi-target regressors forecasting 28-day compressive strength and water absorption in under 15 milliseconds.',
      metrics: 'Dual-Target Multi-Output',
    },
    {
      id: '04',
      title: 'Manufacturing Mix Optimizer',
      route: '/platform/optimization',
      icon: <Sliders size={24} />,
      color: 'var(--status-info)',
      badge: 'Pareto Solver',
      description: 'Constrained multi-objective optimization generating production-ready batch sheets that minimize cost and carbon footprint.',
      metrics: 'Pareto-Optimal Solutions',
    },
  ];

  return (
    <AppShell
      title="Platform Research Hub & Workbench"
      subtitle="Unified environment integrating the four core computational engines of the fly ash brick intelligence framework."
      badge="Platform Operations"
    >
      {/* System Status Banner */}
      <GlassPanel padding="md" style={{ marginBottom: 'var(--space-8)', border: '1px solid var(--border-accent)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--status-success)' }} className="animate-pulse-subtle" />
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Research System Architecture Active
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Frontend Foundation v0.1.0 • Running client-side simulation models
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span className="badge badge-emerald font-mono">IS 12894:2002</span>
            <span className="badge badge-teal font-mono">ASTM C618</span>
            <span className="badge badge-subtle font-mono">DEMO MODE</span>
          </div>
        </div>
      </GlassPanel>

      {/* Modules Launcher Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-12)',
        }}
      >
        {modules.map((mod) => (
          <GlassPanel
            key={mod.id}
            padding="lg"
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              transition: 'transform var(--transition-base), box-shadow var(--transition-base)',
            }}
            className="hub-card"
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  color: mod.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {mod.icon}
              </div>
              <span className="badge badge-subtle font-mono" style={{ fontSize: '0.7rem' }}>
                {mod.badge}
              </span>
            </div>

            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: mod.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Engine {mod.id}
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', marginBottom: 'var(--space-2)' }}>
              {mod.title}
            </h3>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-6)' }}>
              {mod.description}
            </p>

            <div
              style={{
                marginTop: 'auto',
                paddingTop: 'var(--space-4)',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                {mod.metrics}
              </span>
              <Link to={mod.route}>
                <Button variant="primary" size="sm" icon={<ArrowRight size={14} />} iconPosition="right">
                  Launch
                </Button>
              </Link>
            </div>
          </GlassPanel>
        ))}
      </div>

      <style>{`
        .hub-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }
      `}</style>
    </AppShell>
  );
};
