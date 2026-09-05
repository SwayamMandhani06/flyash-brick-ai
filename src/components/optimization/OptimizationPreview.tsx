import React, { useState } from 'react';
import { SectionHeading } from '../common/SectionHeading';
import { Button } from '../common/Button';
import { ParetoConvergenceVisualizer } from './ParetoConvergenceVisualizer';
import type { ParetoPoint } from './ParetoConvergenceVisualizer';
import { Loader2, Compass, ArrowRight, Leaf, ShieldAlert, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

export const OptimizationPreview: React.FC = () => {
  const [targetStrength, setTargetStrength] = useState<number>(15);
  const [maxAbsorption, setMaxAbsorption] = useState<number>(12);
  const [allowCement, setAllowCement] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchStep, setSearchStep] = useState<string>('');
  const [selectedMixId, setSelectedMixId] = useState<string>('OPT-01');

  // Simulated optimization formulation based on targets and clinker allowance
  const getRecommendation = () => {
    if (targetStrength >= 20) {
      return {
        id: 'OPT-03',
        name: allowCement ? 'Hybrid Accelerated Recipe' : 'High-Strength FaL-G',
        flyAsh: allowCement ? 52 : 55,
        cement: allowCement ? 8 : 0,
        lime: allowCement ? 16 : 20,
        gypsum: 5,
        sand: allowCement ? 24 : 20,
        waterBinder: 0.13,
        predictedStrength: allowCement ? 22.4 : 20.8,
        predictedAbsorption: 9.4,
        isClass: 'Target: Class 20 Ref',
        carbonReduction: allowCement ? '62%' : '84%',
        panBatchWeight: '1,250 kg / 500 units',
      };
    } else if (targetStrength >= 15) {
      return {
        id: 'OPT-01',
        name: 'Balanced FaL-G Prescription',
        flyAsh: allowCement ? 62 : 65,
        cement: allowCement ? 4 : 0,
        lime: 18,
        gypsum: 5,
        sand: allowCement ? 11 : 12,
        waterBinder: 0.14,
        predictedStrength: 17.2,
        predictedAbsorption: 11.2,
        isClass: 'Target: Class 15 Ref',
        carbonReduction: allowCement ? '71%' : '88%',
        panBatchWeight: '1,180 kg / 500 units',
      };
    } else {
      return {
        id: 'OPT-02',
        name: 'High Waste Infill Prescription',
        flyAsh: 72,
        cement: 0,
        lime: 14,
        gypsum: 4,
        sand: 10,
        waterBinder: 0.15,
        predictedStrength: 12.4,
        predictedAbsorption: 13.8,
        isClass: 'Target: Class 10 Ref',
        carbonReduction: '92%',
        panBatchWeight: '1,120 kg / 500 units',
      };
    }
  };

  const handleRunOptimization = () => {
    setIsSearching(true);
    setSearchStep('Evaluating 1,420 candidate stoichiometry vectors...');

    setTimeout(() => {
      setSearchStep('Filtering mass balance & IS 3812 chemical constraints...');
    }, 500);

    setTimeout(() => {
      setSearchStep('Synthesizing Pareto non-dominated frontier (Strength vs FA %)...');
    }, 1000);

    setTimeout(() => {
      setIsSearching(false);
      setSearchStep('');
      if (targetStrength >= 20) {
        setSelectedMixId('OPT-03');
      } else if (targetStrength >= 15) {
        setSelectedMixId('OPT-01');
      } else {
        setSelectedMixId('OPT-02');
      }
    }, 1500);
  };

  const handleSelectMixFromPlot = (pt: ParetoPoint) => {
    setSelectedMixId(pt.id);
  };

  const rec = getRecommendation();

  return (
    <section className="section" style={{ backgroundColor: 'var(--bg-surface-subtle)', position: 'relative' }}>
      <div className="container">
        <SectionHeading
          badge="06 / MANUFACTURING OPTIMIZATION"
          badgeVariant="teal"
          title="Engineering Workstation & Pareto Convergence Search"
          highlightWords={['Engineering Workstation', 'Pareto Convergence Search']}
          description="Resolve non-linear multi-objective trade-offs between industrial waste utilization, binder hydration kinetics, and compressive performance."
          align="left"
        />

        {/* Linear Engineering Workflow Conduit */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-8)',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>ENGINEERING FLOW:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>01. Target Specs</span>
          <span style={{ color: 'var(--text-tertiary)' }}>→</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>02. Binder Constraints</span>
          <span style={{ color: 'var(--text-tertiary)' }}>→</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>03. Candidate Space</span>
          <span style={{ color: 'var(--text-tertiary)' }}>→</span>
          <span style={{ color: 'var(--accent-secondary)', fontWeight: 700 }}>04. Pareto Convergence</span>
          <span style={{ color: 'var(--text-tertiary)' }}>→</span>
          <span style={{ color: 'var(--status-success)', fontWeight: 700 }}>05. Batch Prescription</span>
        </div>

        {/* Main Workstation Layout: Open, Layered 3-Column Studio */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(300px, 340px) 1fr minmax(300px, 340px)',
            gap: 'var(--space-6)',
            alignItems: 'start',
          }}
          className="opt-workstation-grid"
        >
          {/* COLUMN 1: Constraints & Parameter Console */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-5)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                <span className="editorial-eyebrow" style={{ fontSize: '0.68rem' }}>INPUT CONSOLE</span>
                <span className="badge badge-subtle font-mono" style={{ fontSize: '0.68rem' }}>STEP 01</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Specification Targets
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                Configure building code minimums for load-bearing or infill masonry units.
              </p>
            </div>

            <div className="hairline-divider" />

            {/* Target Compressive Strength */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Min Compressive Strength</span>
                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                  ≥ {targetStrength} MPa
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
                {[10, 15, 20].map((val) => (
                  <button
                    key={val}
                    onClick={() => {
                      setTargetStrength(val);
                      if (val === 20) setSelectedMixId('OPT-03');
                      else if (val === 15) setSelectedMixId('OPT-01');
                      else setSelectedMixId('OPT-02');
                    }}
                    style={{
                      padding: '7px 4px',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '0.78rem',
                      fontWeight: targetStrength === val ? 700 : 500,
                      backgroundColor: targetStrength === val ? 'var(--accent-primary)' : 'var(--bg-surface-subtle)',
                      color: targetStrength === val ? '#ffffff' : 'var(--text-secondary)',
                      border: '1px solid ' + (targetStrength === val ? 'var(--accent-primary)' : 'var(--border-hairline)'),
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {val} MPa
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                Contextual ref: IS 12894 Class {targetStrength}
              </div>
            </div>

            {/* Maximum Water Absorption */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Max Water Absorption</span>
                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>
                  ≤ {maxAbsorption}%
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
                {[10, 12, 15].map((val) => (
                  <button
                    key={val}
                    onClick={() => setMaxAbsorption(val)}
                    style={{
                      padding: '7px 4px',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '0.78rem',
                      fontWeight: maxAbsorption === val ? 700 : 500,
                      backgroundColor: maxAbsorption === val ? 'var(--accent-secondary)' : 'var(--bg-surface-subtle)',
                      color: maxAbsorption === val ? '#ffffff' : 'var(--text-secondary)',
                      border: '1px solid ' + (maxAbsorption === val ? 'var(--accent-secondary)' : 'var(--border-hairline)'),
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                  >
                    ≤ {val}%
                  </button>
                ))}
              </div>
            </div>

            {/* Clinker Policy Toggle */}
            <div
              style={{
                padding: 'var(--space-3)',
                backgroundColor: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-hairline)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  OPC Clinker Policy
                </span>
                <button
                  onClick={() => setAllowCement(!allowCement)}
                  style={{
                    padding: '3px 9px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    backgroundColor: allowCement ? 'var(--accent-mineral)' : 'var(--status-success)',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {allowCement ? 'Hybrid OPC' : 'Zero Clinker'}
                </button>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: 0 }}>
                {allowCement
                  ? 'Permits up to 8% Portland cement to accelerate early compressive hydration.'
                  : 'Pure pozzolanic binder: Class F fly ash + hydrated lime + phospho-gypsum only.'}
              </p>
            </div>

            {/* Run Optimizer Button */}
            <Button
              variant="primary"
              size="md"
              onClick={handleRunOptimization}
              isLoading={isSearching}
              icon={isSearching ? <Loader2 size={16} /> : <Compass size={16} />}
              style={{ width: '100%' }}
            >
              {isSearching ? 'Evaluating Solutions...' : 'Synthesize Pareto Mix'}
            </Button>
          </div>

          {/* COLUMN 2: Center Interactive Pareto Convergence Visualizer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Real-time search status ticker when running */}
            {isSearching && (
              <div
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: 'var(--accent-primary-subtle)',
                  border: '1px solid var(--accent-primary-light)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: '2px solid var(--border-medium)',
                    borderTopColor: 'var(--accent-primary)',
                    animation: 'spin 0.8s linear infinite',
                    flexShrink: 0,
                  }}
                />
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {searchStep}
                </div>
              </div>
            )}

            <ParetoConvergenceVisualizer
              targetStrength={targetStrength}
              maxAbsorption={maxAbsorption}
              isSearching={isSearching}
              selectedMixId={selectedMixId}
              onSelectMix={handleSelectMixFromPlot}
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                fontSize: '0.74rem',
                color: 'var(--text-tertiary)',
                padding: 'var(--space-2) var(--space-3)',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-hairline)',
              }}
            >
              <Cpu size={14} color="var(--accent-primary)" />
              <span>
                <strong>Algorithm:</strong> Multi-Objective NSGA-II surrogate Pareto sorting over 1,420 experimental bounding constraints.
              </span>
            </div>
          </div>

          {/* COLUMN 3: Right Plant Batch Prescription Sheet */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                <span className="editorial-eyebrow" style={{ fontSize: '0.68rem' }}>PLANT BATCH SHEET</span>
                <span className="badge badge-emerald font-mono" style={{ fontSize: '0.68rem' }}>OUTPUT</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {rec.name}
              </h3>
              <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', marginTop: '2px' }}>
                {rec.id} • {rec.isClass}
              </div>
            </div>

            <div className="hairline-divider" />

            {/* Dry Constituent Mass Percentages */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
                Dry Mix Proportions (Σ = 100%)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                <div style={{ padding: '8px 4px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-xs)', textAlign: 'center', border: '1px solid var(--border-hairline)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>FA</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)' }} className="font-mono">{rec.flyAsh}%</div>
                </div>
                <div style={{ padding: '8px 4px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-xs)', textAlign: 'center', border: '1px solid var(--border-hairline)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>Lime</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-mineral)' }} className="font-mono">{rec.lime}%</div>
                </div>
                <div style={{ padding: '8px 4px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-xs)', textAlign: 'center', border: '1px solid var(--border-hairline)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>Gyp</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-secondary)' }} className="font-mono">{rec.gypsum}%</div>
                </div>
                <div style={{ padding: '8px 4px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-xs)', textAlign: 'center', border: '1px solid var(--border-hairline)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>Sand</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }} className="font-mono">{rec.sand}%</div>
                </div>
              </div>
            </div>

            {/* Performance Estimates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
              <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-primary-subtle)', border: '1px solid var(--accent-primary-light)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--accent-primary)', fontWeight: 600 }}>PREDICTED 28D</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '1px 0' }} className="font-mono">
                  {rec.predictedStrength} MPa
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  Target ≥ {targetStrength} MPa met
                </div>
              </div>

              <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-secondary-subtle)', border: '1px solid var(--accent-secondary-light)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>ABSORPTION</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '1px 0' }} className="font-mono">
                  {rec.predictedAbsorption}%
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  Target ≤ {maxAbsorption}% met
                </div>
              </div>
            </div>

            {/* Factory Batch Weight Callout */}
            <div
              style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-hairline)',
                fontSize: '0.78rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'var(--status-success)' }}>
                  <Leaf size={13} /> Carbon Reduction:
                </span>
                <span className="font-mono" style={{ fontWeight: 800, color: 'var(--status-success)' }}>
                  {rec.carbonReduction}
                </span>
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                Mixer Batch: <strong className="font-mono">{rec.panBatchWeight}</strong> (W/B = {rec.waterBinder})
              </div>
            </div>

            {/* Link to Dedicated Full Optimizer Workstation */}
            <div style={{ marginTop: 'auto', paddingTop: 'var(--space-2)' }}>
              <Link to="/platform/optimization" style={{ textDecoration: 'none', display: 'block' }}>
                <Button variant="outline" size="sm" icon={<ArrowRight size={14} />} iconPosition="right" style={{ width: '100%' }}>
                  Open Full Optimizer Workstation
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footnote on Demo Accuracy */}
        <div
          style={{
            marginTop: 'var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: '0.74rem',
            color: 'var(--text-tertiary)',
          }}
        >
          <ShieldAlert size={14} />
          <span>
            <strong>Demo Formulation Engine:</strong> Illustrated Pareto convergence and batch calculations are computational demonstrations calibrated for typical Indian Class F fly ash.
          </span>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .opt-workstation-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
};
