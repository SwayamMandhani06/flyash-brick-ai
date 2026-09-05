import React from 'react';
import { SectionHeading } from '../components/common/SectionHeading';
import { GlassPanel } from '../components/common/GlassPanel';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';

export const MethodologyPage: React.FC = () => {
  return (
    <div style={{ padding: 'var(--space-12) 0 var(--space-20)' }}>
      <div className="container">
        <SectionHeading
          badge="MATHEMATICAL & COMPUTATIONAL FORMULATION"
          badgeVariant="teal"
          title="Computational Architecture & Algorithmic Pipeline"
          highlightWords={['Computational Architecture', 'Algorithmic Pipeline']}
          description="A formal specification of the data harmonization, multi-target predictive surrogate modeling, and constrained optimization formulation."
        />

        {/* 4 Pipeline Layers Detailed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', marginBottom: 'var(--space-12)' }}>
          {/* Layer 1 */}
          <GlassPanel padding="lg">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <span className="badge badge-emerald font-mono">LAYER 01</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>DOCUMENT PARSING & HEURISTIC OCR</span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
              Heterogeneous Table Mining Pipeline
            </h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
              Scans unstructured scientific PDF publications, applies bounding-box heuristics to isolate experimental mix design tables, and performs token extraction to match constituent keywords (Fly Ash Class F/C, Lime, Gypsum, OPC, Quarry Dust).
            </p>
            <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              TableTokenMatch = argmax_c [ CosSim(Embed(cell_text), ClassLexicon_c) ]
            </div>
          </GlassPanel>

          {/* Layer 2 */}
          <GlassPanel padding="lg">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <span className="badge badge-teal font-mono">LAYER 02</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>FEATURE STANDARDIZATION & STOICHIOMETRY</span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
              Mass Balance Normalization & Validation Checks
            </h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
              Converts heterogeneous units (grams per batch, weight fractions, dry mass ratios) into a normalized feature vector X where the dry solid mass percentages sum strictly to 100%:
            </p>
            <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              x_FA + x_Lime + x_Gypsum + x_OPC + x_Agg = 100.0% &plusmn; 0.1%
            </div>
          </GlassPanel>

          {/* Layer 3 */}
          <GlassPanel padding="lg">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <span className="badge badge-amber font-mono">LAYER 03</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>ADAPTIVE PREDICTIVE SURROGATE</span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
              Multi-Target Machine Learning Formulation
            </h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
              Simultaneously estimates 28-day Compressive Strength (y1) and 24-hour Water Absorption (y2) as continuous regression targets:
            </p>
            <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              [ y1, y2 ] = Model_ensemble(x1, x2, ..., xk, W/B, CuringDays)
            </div>
          </GlassPanel>

          {/* Layer 4 */}
          <GlassPanel padding="lg">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <span className="badge badge-subtle font-mono">LAYER 04</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>CONSTRAINED PARETO SEARCH</span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
              Multi-Objective Optimization Formulation
            </h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
              Formulated to maximize fly ash utilization while guaranteeing building code structural and durability thresholds:
            </p>
            <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: 1.8 }}>
              <strong>Minimize:</strong> Cost(x) &amp; CarbonFootprint(x)<br />
              <strong>Maximize:</strong> x_FA (Fly Ash replacement ratio)<br />
              <strong>Subject to:</strong><br />
              &bull; CompressiveStrength(x) &ge; S_target (e.g. 15.0 MPa for Class 15)<br />
              &bull; WaterAbsorption(x) &le; A_max (e.g. 12.0% by mass)<br />
              &bull; &sum; x_i = 100%, \quad x_i &ge; 0
            </div>
          </GlassPanel>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Link to="/platform">
            <Button variant="primary" size="lg" icon={<ArrowRight size={16} />} iconPosition="right">
              Explore Live Platform Engines
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
