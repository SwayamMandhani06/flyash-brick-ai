import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Database, Cpu, Sliders } from 'lucide-react';

export const ModulesSection: React.FC = () => {
  return (
    <section className="section" style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-hairline)' }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ marginBottom: 'var(--space-12)' }}>
          <div className="editorial-eyebrow" style={{ marginBottom: 'var(--space-2)' }}>
            System Architecture &bull; 4 Modular Computational Layers
          </div>
          <h2 style={{ fontSize: 'clamp(1.85rem, 3vw + 0.5rem, 2.6rem)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            The Four Platform Engines
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '640px', marginTop: 'var(--space-2)' }}>
            A modular pipeline designed to solve data fragmentation, predict physical performance, and optimize industrial production parameters.
          </p>
        </div>

        {/* 2-Pillar Editorial Architecture (Data Foundation vs AI Optimization) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 'var(--space-8)',
          }}
          className="modules-editorial-grid"
        >
          {/* Pillar 1: Data Foundation (Engines 01 & 02) */}
          <div
            style={{
              padding: 'var(--space-8)',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-medium)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-hairline)' }}>
              <span className="editorial-eyebrow">PHASE I &bull; DATA FOUNDATION</span>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Engines 01 &amp; 02</span>
            </div>

            {/* Engine 01 */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-primary-subtle)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>ENGINE 01</div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Literature Data Extraction</h3>
                </div>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-3)' }}>
                Ingests empirical PDF papers, parses multi-column mix tables via bounding-box OCR heuristics, and standardizes multi-author terminology into structured records.
              </p>
              <Link to="/platform/extraction" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                Open Extraction Workbench &rarr;
              </Link>
            </div>

            <div className="hairline-divider" style={{ margin: 'var(--space-4) 0' }} />

            {/* Engine 02 */}
            <div style={{ marginTop: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-secondary-subtle)', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Database size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>ENGINE 02</div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Benchmark Dataset &amp; Validator</h3>
                </div>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-3)' }}>
                Enforces chemical mass balance checks (100% dry solid sum), identifies testing outliers, and standardizes feature vectors according to IS 12894:2002 guidelines.
              </p>
              <Link to="/platform/dataset" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                Explore Standardized Dataset &rarr;
              </Link>
            </div>
          </div>

          {/* Pillar 2: Intelligence & Optimization (Engines 03 & 04) */}
          <div
            style={{
              padding: 'var(--space-8)',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-medium)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-hairline)' }}>
              <span className="editorial-eyebrow">PHASE II &bull; MODELING &amp; DECISION</span>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Engines 03 &amp; 04</span>
            </div>

            {/* Engine 03 */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-mineral-subtle)', color: 'var(--accent-mineral)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Cpu size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>ENGINE 03</div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Adaptive AI Quality Prediction</h3>
                </div>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-3)' }}>
                Multi-output surrogate models trained on empirical records to forecast 28-day Compressive Strength (MPa) and 24-hour Water Absorption (%) simultaneously.
              </p>
              <Link to="/platform/prediction" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-mineral)' }}>
                Open Prediction Laboratory &rarr;
              </Link>
            </div>

            <div className="hairline-divider" style={{ margin: 'var(--space-4) 0' }} />

            {/* Engine 04 */}
            <div style={{ marginTop: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-primary-subtle)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sliders size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>ENGINE 04</div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Manufacturing Mix Optimizer</h3>
                </div>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-3)' }}>
                Constrained Pareto multi-objective search maximizing fly ash utilization while guaranteeing structural building code requirements and minimizing carbon footprint.
              </p>
              <Link to="/platform/optimization" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                Launch Manufacturing Optimizer &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
