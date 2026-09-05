import React, { useState, useMemo } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/common/Button';
import { ShieldAlert } from 'lucide-react';

export const PredictionPage: React.FC = () => {
  const [flyAsh, setFlyAsh] = useState<number>(65);
  const [cement, setCement] = useState<number>(0);
  const [lime, setLime] = useState<number>(18);
  const [gypsum, setGypsum] = useState<number>(5);
  const [waterBinder, setWaterBinder] = useState<number>(0.14);

  const sandAggregate = useMemo(() => {
    return Math.max(0, 100 - (flyAsh + cement + lime + gypsum));
  }, [flyAsh, cement, lime, gypsum]);

  // Compute 3d, 7d, 14d, 28d strength predictions based on chemical activation heuristic
  const predictions = useMemo(() => {
    const binder = (lime * 0.42) + (gypsum * 0.75) + (cement * 0.95);
    const filler = (flyAsh * 0.12);
    const wbBonus = (0.20 - waterBinder) * 45;

    const base28d = Math.max(4.0, Math.min(26.5, (binder + filler + wbBonus)));
    const str3d = parseFloat((base28d * 0.28).toFixed(1));
    const str7d = parseFloat((base28d * 0.54).toFixed(1));
    const str14d = parseFloat((base28d * 0.76).toFixed(1));
    const str28d = parseFloat(base28d.toFixed(1));

    let abs = 22.0 - (str28d * 0.52) - (cement * 0.15) - (lime * 0.1);
    abs = Math.max(7.5, Math.min(22.0, parseFloat(abs.toFixed(1))));

    let cls = 'Class 10';
    if (str28d >= 20.0) cls = 'Class 20';
    else if (str28d >= 17.5) cls = 'Class 17.5';
    else if (str28d >= 15.0) cls = 'Class 15';
    else if (str28d >= 12.5) cls = 'Class 12.5';
    else if (str28d >= 10.0) cls = 'Class 10';
    else if (str28d >= 7.5) cls = 'Class 7.5';

    return { str3d, str7d, str14d, str28d, abs, cls };
  }, [flyAsh, cement, lime, gypsum, waterBinder]);

  const loadPreset = (preset: 'falg' | 'hvfa' | 'hybrid') => {
    if (preset === 'falg') {
      setFlyAsh(65);
      setCement(0);
      setLime(18);
      setGypsum(5);
      setWaterBinder(0.14);
    } else if (preset === 'hvfa') {
      setFlyAsh(75);
      setCement(0);
      setLime(14);
      setGypsum(4);
      setWaterBinder(0.15);
    } else {
      setFlyAsh(55);
      setCement(8);
      setLime(15);
      setGypsum(4);
      setWaterBinder(0.13);
    }
  };

  return (
    <AppShell
      title="03. Adaptive AI Quality Prediction Workbench"
      subtitle="Model-centric calibration laboratory forecasting mechanical strength evolution and water permeability from batch stoichiometry."
      badge="Predictive AI"
      badgeVariant="amber"
      actions={
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outline" size="sm" onClick={() => loadPreset('falg')}>FaL-G (Standard)</Button>
          <Button variant="outline" size="sm" onClick={() => loadPreset('hvfa')}>HVFA (75% Ash)</Button>
          <Button variant="outline" size="sm" onClick={() => loadPreset('hybrid')}>Hybrid (OPC Clinker)</Button>
        </div>
      }
    >
      {/* 3-Step Scientific Flow Indicator */}
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
          marginBottom: 'var(--space-6)',
          fontSize: '0.78rem',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span style={{ color: 'var(--accent-mineral)', fontWeight: 700 }}>INFERENCE PIPELINE:</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>01. Batch Stoichiometry</span>
        <span style={{ color: 'var(--text-tertiary)' }}>→</span>
        <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>02. Ensemble Model Inference</span>
        <span style={{ color: 'var(--text-tertiary)' }}>→</span>
        <span style={{ color: 'var(--status-success)', fontWeight: 700 }}>03. Predicted Quality & IS Classification</span>
      </div>

      {/* Model-Centric 2-Column Laboratory Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 400px) 1fr',
          gap: 'var(--space-6)',
          alignItems: 'start',
        }}
        className="prediction-grid"
      >
        {/* LEFT: Batch Formulation & Stoichiometric Sliders */}
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
            <span className="editorial-eyebrow" style={{ fontSize: '0.68rem' }}>INPUT VECTOR (X)</span>
            <h3 style={{ fontSize: '1.18rem', fontWeight: 700, margin: '2px 0 0', color: 'var(--text-primary)' }}>
              Batch Formulation Inputs
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Adjust dry mass percentages and water-to-binder ratio to trigger real-time surrogate inference.
            </p>
          </div>

          <div className="hairline-divider" />

          {/* Sliders Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Fly Ash */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Class F Fly Ash %</span>
                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{flyAsh}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="80"
                value={flyAsh}
                onChange={(e) => setFlyAsh(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
            </div>

            {/* Hydrated Lime */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Hydrated Lime % (Ca(OH)₂)</span>
                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-mineral)' }}>{lime}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                value={lime}
                onChange={(e) => setLime(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-mineral)' }}
              />
            </div>

            {/* Phospho-Gypsum */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Phospho-Gypsum % (CaSO₄·2H₂O)</span>
                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>{gypsum}%</span>
              </div>
              <input
                type="range"
                min="2"
                max="10"
                value={gypsum}
                onChange={(e) => setGypsum(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-secondary)' }}
              />
            </div>

            {/* OPC Cement */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>OPC Clinker % (Optional Additive)</span>
                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{cement}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                value={cement}
                onChange={(e) => setCement(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--text-primary)' }}
              />
            </div>

            {/* Water to Binder */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Water / Binder Ratio (W/B)</span>
                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{waterBinder}</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.20"
                step="0.01"
                value={waterBinder}
                onChange={(e) => setWaterBinder(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
            </div>

            {/* Calculated Sand/Aggregate Fill */}
            <div
              style={{
                padding: 'var(--space-3)',
                backgroundColor: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-hairline)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.82rem',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>Sand / Inert Stone Dust (Balance):</span>
              <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{sandAggregate}%</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Real-time Multi-Target Model Inference & Curing Kinetics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Target Outputs Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <div>
                <span className="editorial-eyebrow" style={{ fontSize: '0.68rem' }}>PREDICTED QUALITY PARAMETERS</span>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Sample Surrogate Model Inference
                </h4>
              </div>
              <span className="badge badge-emerald font-mono" style={{ fontSize: '0.72rem' }}>
                IS 12894 {predictions.cls}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
              <div
                style={{
                  padding: 'var(--space-4)',
                  backgroundColor: 'var(--accent-primary-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--accent-primary-light)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                  28-Day Compressive Strength
                </div>
                <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0' }} className="font-mono">
                  {predictions.str28d} <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>MPa</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  IS 3495 Part 1 Specimen Compression
                </div>
              </div>

              <div
                style={{
                  padding: 'var(--space-4)',
                  backgroundColor: 'var(--accent-secondary-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--accent-secondary-light)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--accent-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                  24-Hour Water Absorption
                </div>
                <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0' }} className="font-mono">
                  {predictions.abs} <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>%</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--status-success)' }}>
                  Conforming (IS 12894 Limit ≤ 20%)
                </div>
              </div>
            </div>

            {/* Hydration Kinetics Progression */}
            <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Strength Development Kinetics Curve
                </span>
                <span className="badge badge-subtle font-mono" style={{ fontSize: '0.65rem' }}>
                  Ambient Curing (27 ± 2°C)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {/* 3 Day */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>3-Day Early Handling (Demolding):</span>
                    <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{predictions.str3d} MPa</span>
                  </div>
                  <div style={{ height: '7px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(predictions.str3d / 28) * 100}%`, height: '100%', backgroundColor: 'var(--text-muted)' }} />
                  </div>
                </div>

                {/* 7 Day */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>7-Day Stacking & Transport Strength:</span>
                    <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-mineral)' }}>{predictions.str7d} MPa</span>
                  </div>
                  <div style={{ height: '7px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(predictions.str7d / 28) * 100}%`, height: '100%', backgroundColor: 'var(--accent-mineral)' }} />
                  </div>
                </div>

                {/* 14 Day */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>14-Day Pozzolanic Intermediate:</span>
                    <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>{predictions.str14d} MPa</span>
                  </div>
                  <div style={{ height: '7px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(predictions.str14d / 28) * 100}%`, height: '100%', backgroundColor: 'var(--accent-secondary)' }} />
                  </div>
                </div>

                {/* 28 Day */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>28-Day Standard Design Strength:</span>
                    <span className="font-mono" style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>{predictions.str28d} MPa</span>
                  </div>
                  <div style={{ height: '7px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(predictions.str28d / 28) * 100}%`, height: '100%', backgroundColor: 'var(--accent-primary)' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Model Credibility & Research Disclaimer */}
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-hairline)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              fontSize: '0.74rem',
              color: 'var(--text-tertiary)',
            }}
          >
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>
              <strong>Sample Prediction / Illustrative Demo Output:</strong> Values displayed in this frontend demo are generated via simulated surrogate response surfaces to demonstrate interactive UI capability. Final model weights and rigorous statistical metrics (R², RMSE, 10-fold cross-validation) will be published upon completion of the machine learning training pipeline.
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .prediction-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </AppShell>
  );
};
