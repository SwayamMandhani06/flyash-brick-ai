import React, { useState } from 'react';
import { SectionHeading } from '../common/SectionHeading';
import { GlassPanel } from '../common/GlassPanel';
import { Button } from '../common/Button';
import { Loader2, Compass, ArrowRight, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';

export const OptimizationPreview: React.FC = () => {
  const [targetStrength, setTargetStrength] = useState<number>(15);
  const [maxAbsorption, setMaxAbsorption] = useState<number>(12);
  const [allowCement, setAllowCement] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchStep, setSearchStep] = useState<string>('');
  const [hasResult, setHasResult] = useState<boolean>(true);

  // Simulated optimization formulation based on targets
  const getRecommendation = () => {
    if (targetStrength >= 20) {
      return {
        flyAsh: allowCement ? 52 : 55,
        cement: allowCement ? 8 : 0,
        lime: allowCement ? 16 : 20,
        gypsum: 5,
        sand: allowCement ? 24 : 20,
        waterBinder: 0.13,
        predictedStrength: 21.8,
        predictedAbsorption: 9.4,
        isClass: 'Class 20',
        carbonReduction: allowCement ? '62%' : '84%',
        panBatchWeight: '1,250 kg / 500 bricks',
      };
    } else if (targetStrength >= 15) {
      return {
        flyAsh: 65,
        cement: allowCement ? 4 : 0,
        lime: 18,
        gypsum: 5,
        sand: allowCement ? 8 : 12,
        waterBinder: 0.14,
        predictedStrength: 17.2,
        predictedAbsorption: 11.2,
        isClass: 'Class 15',
        carbonReduction: allowCement ? '71%' : '88%',
        panBatchWeight: '1,180 kg / 500 bricks',
      };
    } else {
      return {
        flyAsh: 72,
        cement: 0,
        lime: 14,
        gypsum: 4,
        sand: 10,
        waterBinder: 0.15,
        predictedStrength: 12.4,
        predictedAbsorption: 13.8,
        isClass: 'Class 10',
        carbonReduction: '92%',
        panBatchWeight: '1,120 kg / 500 bricks',
      };
    }
  };

  const handleRunOptimization = () => {
    setIsSearching(true);
    setSearchStep('Evaluating 1,420 candidate formulation vectors...');

    setTimeout(() => {
      setSearchStep('Filtering stoichiometric mass balances & IS 3812 limits...');
    }, 600);

    setTimeout(() => {
      setSearchStep('Constructing Pareto frontier (Strength vs Fly Ash %)...');
    }, 1200);

    setTimeout(() => {
      setIsSearching(false);
      setSearchStep('');
      setHasResult(true);
    }, 1800);
  };

  const rec = getRecommendation();

  return (
    <section className="section" style={{ backgroundColor: 'var(--bg-surface-subtle)', position: 'relative' }}>
      <div className="container">
        <SectionHeading
          badge="06 / MANUFACTURING OPTIMIZATION"
          badgeVariant="teal"
          title="Manufacturing Optimization & Pareto Formulation Search"
          highlightWords={['Manufacturing Optimization', 'Pareto Formulation Search']}
          description="Specify target engineering constraints and let the adaptive optimization framework determine the optimal sustainable batching recipe."
          align="left"
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-8)',
          }}
          className="opt-grid"
        >
          {/* Target Engineering Constraints Configuration */}
          <GlassPanel elevation="medium" padding="lg">
            <div style={{ marginBottom: 'var(--space-5)' }}>
              <span className="badge badge-subtle font-mono">STEP 1: OBJECTIVES</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '4px' }}>
                Define Quality Targets
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Set required building code minimums for load-bearing or infill masonry.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {/* Target Compressive Strength */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>Minimum Compressive Strength</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                    ≥ {targetStrength} MPa
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
                  {[10, 15, 20].map((val) => (
                    <button
                      key={val}
                      onClick={() => setTargetStrength(val)}
                      style={{
                        padding: '8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.82rem',
                        fontWeight: targetStrength === val ? 700 : 500,
                        backgroundColor: targetStrength === val ? 'var(--accent-primary)' : 'var(--bg-surface)',
                        color: targetStrength === val ? '#ffffff' : 'var(--text-secondary)',
                        border: '1px solid var(--border-medium)',
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                      }}
                    >
                      {val} MPa (Class {val})
                    </button>
                  ))}
                </div>
              </div>

              {/* Maximum Water Absorption */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>Maximum Water Absorption</span>
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
                        padding: '8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.82rem',
                        fontWeight: maxAbsorption === val ? 700 : 500,
                        backgroundColor: maxAbsorption === val ? 'var(--accent-secondary)' : 'var(--bg-surface)',
                        color: maxAbsorption === val ? '#ffffff' : 'var(--text-secondary)',
                        border: '1px solid var(--border-medium)',
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                      }}
                    >
                      ≤ {val}% Max
                    </button>
                  ))}
                </div>
              </div>

              {/* Clinker Policy Toggle */}
              <div
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Permit OPC Cement Clinker
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Toggle zero-cement vs hybrid binder search
                  </div>
                </div>
                <button
                  onClick={() => setAllowCement(!allowCement)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    backgroundColor: allowCement ? 'var(--accent-mineral)' : 'var(--status-success)',
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  {allowCement ? 'Hybrid OPC Allowed' : 'Zero Clinker (FaL-G)'}
                </button>
              </div>

              {/* Run Optimizer Trigger */}
              <Button
                variant="primary"
                size="lg"
                onClick={handleRunOptimization}
                isLoading={isSearching}
                icon={isSearching ? <Loader2 size={18} /> : <Compass size={18} />}
                style={{ width: '100%', marginTop: 'var(--space-2)' }}
              >
                {isSearching ? 'Searching Pareto Space...' : 'Run Optimization Search'}
              </Button>
            </div>
          </GlassPanel>

          {/* Right Column: Search Progress & Recommended Mix Output */}
          <GlassPanel elevation="high" padding="lg" accentBorder style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <div>
                <span className="badge badge-teal font-mono">RECOMMENDED FORMULATION</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '4px' }}>
                  Pareto-Optimal Batching Specification
                </h3>
              </div>
              <span className="badge badge-subtle font-mono" style={{ fontSize: '0.72rem' }}>
                IS 12894 Compliant
              </span>
            </div>

            {/* If Searching, show animated progress state */}
            {isSearching && (
              <div
                style={{
                  padding: 'var(--space-10) var(--space-6)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-4)',
                }}
              >
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    border: '3px solid var(--border-medium)',
                    borderTopColor: 'var(--accent-primary)',
                    animation: 'spin 0.9s linear infinite',
                  }}
                />
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {searchStep}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Evaluating multi-objective trade-offs between fly ash % and 28-day hydration kinetics...
                </div>
              </div>
            )}

            {/* If Not Searching, display recommended recipe */}
            {!isSearching && hasResult && (
              <div>
                {/* Recommended Constituent Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
                  <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Fly Ash</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-primary)' }} className="font-mono">
                      {rec.flyAsh}%
                    </div>
                  </div>
                  <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Lime</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-mineral)' }} className="font-mono">
                      {rec.lime}%
                    </div>
                  </div>
                  <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Gypsum</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-secondary)' }} className="font-mono">
                      {rec.gypsum}%
                    </div>
                  </div>
                  <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sand / Dust</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }} className="font-mono">
                      {rec.sand}%
                    </div>
                  </div>
                </div>

                {/* Performance Metrics Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                  <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--accent-primary-subtle)', border: '1px solid var(--accent-primary-light)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontWeight: 600 }}>PREDICTED STRENGTH</div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0' }} className="font-mono">
                      {rec.predictedStrength} MPa
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Target ≥ {targetStrength} MPa met
                    </div>
                  </div>

                  <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--accent-secondary-subtle)', border: '1px solid var(--accent-secondary-light)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>PREDICTED ABSORPTION</div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0' }} className="font-mono">
                      {rec.predictedAbsorption}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Target ≤ {maxAbsorption}% met
                    </div>
                  </div>
                </div>

                {/* Sustainability Impact & Factory Batch Note */}
                <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)', marginBottom: 'var(--space-6)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                      <Leaf size={14} /> Embodied CO₂ Reduction:
                    </span>
                    <span className="font-mono" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                      {rec.carbonReduction} vs Clay Bricks
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Plant Batching Weight: <strong className="font-mono">{rec.panBatchWeight}</strong> at W/B ratio {rec.waterBinder}
                  </div>
                </div>

                {/* Link to Full Optimizer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Link to="/platform/optimization">
                    <Button variant="primary" icon={<ArrowRight size={16} />} iconPosition="right">
                      Open Dedicated Mix Optimizer
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </GlassPanel>
        </div>
      </div>
    </section>
  );
};
