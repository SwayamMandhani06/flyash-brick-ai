import React from 'react';
import { SectionHeading } from '../common/SectionHeading';
import { ModuleCard } from './ModuleCard';
import { BookOpen, Database, Cpu, Sliders, CheckCircle2, Sparkles, Compass } from 'lucide-react';

export const ModulesSection: React.FC = () => {
  return (
    <section className="section" style={{ backgroundColor: 'var(--bg-app)' }}>
      <div className="container">
        <SectionHeading
          badge="03 / CORE SYSTEM MODULES"
          badgeVariant="teal"
          title="Four Specialized Engines Powering the Research Framework"
          highlightWords={['Four Specialized Engines', 'Research Framework']}
          description="Designed as modular, interoperable computational layers that take materials research from unstructured PDF literature to factory-floor batching."
          align="left"
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-6)',
          }}
        >
          {/* Module 01: Literature Intelligence */}
          <ModuleCard
            number="01"
            title="Literature Intelligence"
            tagline="Automated Document Extraction"
            description="Ingests empirical research PDFs, parses heterogeneous data tables, and converts published experimental mixes into clean structured records."
            icon={<BookOpen size={22} />}
            accentColor="emerald"
            linkTo="/platform/extraction"
            features={[
              'Multi-column scientific table detection',
              'Raw chemical notation parsing (wt%, g/kg)',
              'Extraction confidence telemetry scores',
            ]}
            previewElement={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-tertiary)' }}>
                  <span>PDF Parser:</span>
                  <span className="badge badge-emerald font-mono" style={{ fontSize: '0.65rem' }}>Active</span>
                </div>
                <div style={{ padding: '6px 8px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)' }}>
                  [Table 2] Mix: FA 65% + Lime 18% + Gyp 5%
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', fontSize: '0.72rem' }}>
                  <CheckCircle2 size={12} />
                  <span>380 experimental rows extracted</span>
                </div>
              </div>
            }
          />

          {/* Module 02: Dataset Intelligence */}
          <ModuleCard
            number="02"
            title="Dataset Intelligence"
            tagline="Standardization & Validation"
            description="Enforces strict stoichiometric sum checks (100% dry basis), filters anomalous testing entries, and verifies compliance against IS 12894:2002."
            icon={<Database size={22} />}
            accentColor="teal"
            linkTo="/platform/dataset"
            features={[
              'IS 3812:2013 chemical mass balances',
              'Outlier & incomplete data flagger',
              'Open benchmark CSV & JSON export',
            ]}
            previewElement={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-tertiary)' }}>
                  <span>Benchmark Corpus:</span>
                  <span className="badge badge-teal font-mono" style={{ fontSize: '0.65rem' }}>IS 12894</span>
                </div>
                <div style={{ padding: '6px 8px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)' }}>
                  Record UID: FA-BENCH-08 • 28D Water Cure
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-success)', fontSize: '0.72rem' }}>
                  <CheckCircle2 size={12} />
                  <span>100% Mass balance verified</span>
                </div>
              </div>
            }
          />

          {/* Module 03: Quality Prediction */}
          <ModuleCard
            number="03"
            title="Quality Prediction"
            tagline="Adaptive AI Modeling"
            description="Multi-target ensemble regressors map constituent ratios and curing age into instant predictions for 28-day compressive strength and water absorption."
            icon={<Cpu size={22} />}
            accentColor="amber"
            linkTo="/platform/prediction"
            features={[
              'Dual-target prediction (MPa + % Absorption)',
              'IS 12894 strength grade classification',
              'Constituent sensitivity feedback',
            ]}
            previewElement={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-tertiary)' }}>
                  <span>Surrogate Model:</span>
                  <span className="badge badge-amber font-mono" style={{ fontSize: '0.65rem' }}>Ensemble</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)' }}>
                  <span>Strength: <strong>16.8 MPa</strong></span>
                  <span>Abs: <strong>11.9%</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-mineral)', fontSize: '0.72rem' }}>
                  <Sparkles size={12} />
                  <span>Class 15 structural masonry grade</span>
                </div>
              </div>
            }
          />

          {/* Module 04: Manufacturing Optimization */}
          <ModuleCard
            number="04"
            title="Mix Optimization"
            tagline="Constrained Decision Engine"
            description="Discovers the optimal trade-off between maximizing industrial fly ash content, minimizing expensive cement, and meeting target strength specifications."
            icon={<Sliders size={22} />}
            accentColor="blue"
            linkTo="/platform/optimization"
            features={[
              'Multi-objective Pareto frontier solver',
              'Embodied carbon minimization index',
              'Automated plant batch sheet generation',
            ]}
            previewElement={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-tertiary)' }}>
                  <span>Pareto Search:</span>
                  <span className="badge badge-subtle font-mono" style={{ fontSize: '0.65rem' }}>Feasible</span>
                </div>
                <div style={{ padding: '6px 8px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)' }}>
                  Recommended: 65% FA • 0% OPC • 18% Lime
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-info)', fontSize: '0.72rem' }}>
                  <Compass size={12} />
                  <span>78% CO₂ reduction vs red clay</span>
                </div>
              </div>
            }
          />
        </div>
      </div>
    </section>
  );
};
