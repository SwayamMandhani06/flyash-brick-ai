import React, { useState, useMemo } from 'react';
import { Button } from '../common/Button';
import { AnimatedCounter } from '../common/AnimatedCounter';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PredictionPreview: React.FC = () => {
  // Input Mix Parameters
  const [flyAsh, setFlyAsh] = useState<number>(65);
  const [cement, setCement] = useState<number>(0);
  const [lime, setLime] = useState<number>(18);
  const [gypsum, setGypsum] = useState<number>(5);
  const [curingDays, setCuringDays] = useState<number>(28);
  const [waterBinder, setWaterBinder] = useState<number>(0.14);

  // Auto-calculated Sand / Inert Aggregate to total 100%
  const sandAggregate = useMemo(() => {
    const raw = 100 - (flyAsh + cement + lime + gypsum);
    return Math.max(0, raw);
  }, [flyAsh, cement, lime, gypsum]);

  // Empirical Surrogate Model Calculation for Interface Demo
  const { predictedStrength, predictedAbsorption, isClass } = useMemo(() => {
    const binderEffect = (lime * 0.42) + (gypsum * 0.75) + (cement * 0.95);
    const fillerEffect = (flyAsh * 0.12);
    const wbPenalty = (0.20 - waterBinder) * 45;

    const ageMultiplier = curingDays === 7 ? 0.52 : curingDays === 14 ? 0.74 : 1.0;

    let strength = (binderEffect + fillerEffect + wbPenalty) * ageMultiplier;
    strength = Math.max(4.0, Math.min(26.5, parseFloat(strength.toFixed(1))));

    let absorption = 22.0 - (strength * 0.52) - (cement * 0.15) - (lime * 0.1);
    absorption = Math.max(7.5, Math.min(22.0, parseFloat(absorption.toFixed(1))));

    let cls = 'Non-Conforming';
    if (strength >= 20.0) cls = 'Class 20';
    else if (strength >= 17.5) cls = 'Class 17.5';
    else if (strength >= 15.0) cls = 'Class 15';
    else if (strength >= 12.5) cls = 'Class 12.5';
    else if (strength >= 10.0) cls = 'Class 10';
    else if (strength >= 7.5) cls = 'Class 7.5';

    return {
      predictedStrength: strength,
      predictedAbsorption: absorption,
      isClass: cls,
    };
  }, [flyAsh, cement, lime, gypsum, curingDays, waterBinder]);

  const totalProportion = flyAsh + cement + lime + gypsum + sandAggregate;

  return (
    <section className="section" style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-hairline)' }}>
      <div className="container">
        {/* Editorial Section Header */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div className="editorial-eyebrow" style={{ marginBottom: 'var(--space-2)' }}>
            SURROGATE MACHINE LEARNING &bull; SAMPLE PREDICTION
          </div>
          <h2 style={{ fontSize: 'clamp(1.85rem, 3vw + 0.5rem, 2.6rem)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Adaptive Quality Prediction Sandbox
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '640px', marginTop: 'var(--space-2)' }}>
            Adjust batching constituents and observe real-time surrogate inference for 28-day compressive strength and water absorption against IS 12894 building standards.
          </p>
        </div>

        {/* 3-Step Scientific Flow Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-4)',
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-hairline)',
            marginBottom: 'var(--space-6)',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-tertiary)',
            overflowX: 'auto',
          }}
        >
          <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>01. Batch Inputs</span>
          <span>&rarr;</span>
          <span style={{ color: 'var(--accent-secondary)', fontWeight: 700 }}>02. Model Inference</span>
          <span>&rarr;</span>
          <span style={{ color: 'var(--accent-mineral)', fontWeight: 700 }}>03. IS 12894 Classification</span>
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>Demo Model Output</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-8)',
          }}
          className="prediction-grid"
        >
          {/* Left Column: Mix Parameters Slider Controls */}
          <div
            style={{
              padding: 'var(--space-6)',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-medium)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
              <div>
                <span className="editorial-eyebrow" style={{ fontSize: '0.7rem' }}>INPUT PARAMETERS</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>
                  Constituent Proportions
                </h3>
              </div>
              <div
                style={{
                  fontSize: '0.76rem',
                  fontFamily: 'var(--font-mono)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: totalProportion === 100 ? 'var(--status-success-bg)' : 'var(--status-warning-bg)',
                  color: totalProportion === 100 ? 'var(--status-success)' : 'var(--status-warning)',
                  fontWeight: 700,
                }}
              >
                Sum: {totalProportion}% Dry Solids
              </div>
            </div>

            {/* Sliders List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {/* Fly Ash Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Fly Ash (Class F)</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{flyAsh}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="80"
                  step="1"
                  value={flyAsh}
                  onChange={(e) => setFlyAsh(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  <span>40%</span>
                  <span>Range: 55–70%</span>
                  <span>80%</span>
                </div>
              </div>

              {/* Lime (CaO) Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Hydrated Lime / CaO</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-mineral)' }}>{lime}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="25"
                  step="1"
                  value={lime}
                  onChange={(e) => setLime(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-mineral)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  <span>5%</span>
                  <span>Activator: 12–20%</span>
                  <span>25%</span>
                </div>
              </div>

              {/* Gypsum Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Phosphogypsum / Gypsum</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>{gypsum}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  step="1"
                  value={gypsum}
                  onChange={(e) => setGypsum(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-secondary)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  <span>2%</span>
                  <span>Sulfate accelerator: 3–6%</span>
                  <span>10%</span>
                </div>
              </div>

              {/* OPC Cement Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Portland Cement (OPC)</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: cement === 0 ? 'var(--status-success)' : 'var(--text-primary)' }}>
                    {cement === 0 ? '0% (Zero-Clinker)' : `${cement}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="1"
                  value={cement}
                  onChange={(e) => setCement(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  <span>0% (Green FaL-G)</span>
                  <span>Optional additive</span>
                  <span>15%</span>
                </div>
              </div>

              {/* Water to Binder Ratio Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Water-to-Binder Ratio (W/B)</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>{waterBinder}</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.20"
                  step="0.01"
                  value={waterBinder}
                  onChange={(e) => setWaterBinder(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-secondary)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  <span>0.10 (Dry Mix)</span>
                  <span>Standard: 0.13–0.16</span>
                  <span>0.20</span>
                </div>
              </div>

              {/* Inert Sand / Quarry Dust Balance */}
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Sand / Inert Dust (Auto-Balanced):</span>
                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{sandAggregate}%</span>
              </div>

              {/* Curing Duration */}
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                  Curing Regimen Duration:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
                  {[7, 14, 28].map((days) => (
                    <button
                      key={days}
                      onClick={() => setCuringDays(days)}
                      style={{
                        padding: '6px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.82rem',
                        fontWeight: curingDays === days ? 700 : 500,
                        backgroundColor: curingDays === days ? 'var(--accent-primary)' : 'var(--bg-surface-subtle)',
                        color: curingDays === days ? '#ffffff' : 'var(--text-secondary)',
                        border: '1px solid var(--border-medium)',
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                      }}
                    >
                      {days} Days {days === 28 ? '(Standard)' : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Real-Time Quality Output Visualizer */}
          <div
            style={{
              padding: 'var(--space-6)',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-medium)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <div>
                <span className="editorial-eyebrow" style={{ fontSize: '0.7rem' }}>MODEL INFERENCE OUTPUT</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>
                  Predicted Mechanical Performance
                </h3>
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                }}
              >
                Sample Output
              </span>
            </div>

            {/* Main Dual Predicted Gauges */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              {/* Compressive Strength Output */}
              <div
                style={{
                  padding: 'var(--space-5)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-hairline)',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-primary)', letterSpacing: '0.04em' }}>
                  Compressive Strength
                </span>
                <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 'var(--space-2) 0' }} className="font-mono">
                  <AnimatedCounter end={predictedStrength} decimals={1} /> <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-tertiary)' }}>MPa</span>
                </div>
                <div>
                  <span className="badge badge-emerald font-mono" style={{ fontSize: '0.75rem' }}>
                    {isClass}
                  </span>
                </div>
              </div>

              {/* Water Absorption Output */}
              <div
                style={{
                  padding: 'var(--space-5)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-hairline)',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-secondary)', letterSpacing: '0.04em' }}>
                  Water Absorption
                </span>
                <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 'var(--space-2) 0' }} className="font-mono">
                  <AnimatedCounter end={predictedAbsorption} decimals={1} /> <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-tertiary)' }}>%</span>
                </div>
                <div>
                  <span
                    className="badge font-mono"
                    style={{
                      fontSize: '0.75rem',
                      backgroundColor: predictedAbsorption <= 20.0 ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                      color: predictedAbsorption <= 20.0 ? 'var(--status-success)' : 'var(--status-danger)',
                    }}
                  >
                    {predictedAbsorption <= 20.0 ? 'Pass (≤20% IS 12894)' : 'Fails Limit'}
                  </span>
                </div>
              </div>
            </div>

            {/* Standards Compliance Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', padding: 'var(--space-4)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                IS 12894:2002 Conformance Check:
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: '0.84rem' }}>
                <CheckCircle2 size={16} color="var(--status-success)" />
                <span>Minimum Compressive Strength (≥ 7.5 MPa): <strong>{predictedStrength >= 7.5 ? 'Conforms' : 'Below code threshold'}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: '0.84rem' }}>
                <CheckCircle2 size={16} color="var(--status-success)" />
                <span>24-hour Water Absorption (≤ 20% by mass): <strong>{predictedAbsorption <= 20 ? 'Conforms' : 'Exceeds limit'}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: '0.84rem' }}>
                <ShieldCheck size={16} color="var(--accent-primary)" />
                <span>Carbon Reduction: <strong>{cement === 0 ? '78% lower than burnt clay' : '55% lower than burnt clay'}</strong></span>
              </div>
            </div>

            {/* Link to Prediction Workbench */}
            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
              <Link to="/platform/prediction">
                <Button variant="primary" size="sm" icon={<ArrowRight size={16} />} iconPosition="right">
                  Open Multi-Mix Laboratory
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
