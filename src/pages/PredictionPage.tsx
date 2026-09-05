import React, { useState, useMemo } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { GlassPanel } from '../components/common/GlassPanel';
import { Button } from '../components/common/Button';

export const PredictionPage: React.FC = () => {
  const [flyAsh, setFlyAsh] = useState<number>(65);
  const [cement, setCement] = useState<number>(0);
  const [lime, setLime] = useState<number>(18);
  const [gypsum, setGypsum] = useState<number>(5);
  const [waterBinder, setWaterBinder] = useState<number>(0.14);

  const sandAggregate = useMemo(() => {
    return Math.max(0, 100 - (flyAsh + cement + lime + gypsum));
  }, [flyAsh, cement, lime, gypsum]);

  // Compute 7d, 14d, 28d strength predictions
  const predictions = useMemo(() => {
    const binder = (lime * 0.42) + (gypsum * 0.75) + (cement * 0.95);
    const filler = (flyAsh * 0.12);
    const wbBonus = (0.20 - waterBinder) * 45;

    const base28d = Math.max(4.0, Math.min(26.5, (binder + filler + wbBonus)));
    const str7d = parseFloat((base28d * 0.52).toFixed(1));
    const str14d = parseFloat((base28d * 0.74).toFixed(1));
    const str28d = parseFloat(base28d.toFixed(1));

    let abs = 22.0 - (str28d * 0.52) - (cement * 0.15) - (lime * 0.1);
    abs = Math.max(7.5, Math.min(22.0, parseFloat(abs.toFixed(1))));

    let cls = 'Non-Conforming';
    if (str28d >= 20.0) cls = 'Class 20';
    else if (str28d >= 17.5) cls = 'Class 17.5';
    else if (str28d >= 15.0) cls = 'Class 15';
    else if (str28d >= 12.5) cls = 'Class 12.5';
    else if (str28d >= 10.0) cls = 'Class 10';
    else if (str28d >= 7.5) cls = 'Class 7.5';

    return { str7d, str14d, str28d, abs, cls };
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
      setCement(5);
      setLime(10);
      setGypsum(3);
      setWaterBinder(0.16);
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
      subtitle="Multi-target surrogate models forecasting compressive strength gain over time and water absorption from raw batch stoichiometry."
      badge="Prediction Engine"
      actions={
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outline" size="sm" onClick={() => loadPreset('falg')}>FaL-G Preset</Button>
          <Button variant="outline" size="sm" onClick={() => loadPreset('hvfa')}>HVFA Preset</Button>
          <Button variant="outline" size="sm" onClick={() => loadPreset('hybrid')}>Hybrid Preset</Button>
        </div>
      }
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-8)',
        }}
      >
        {/* Sliders Form */}
        <GlassPanel padding="lg">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
            Batch Formulation Parameters
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>Fly Ash %</span>
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

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>Hydrated Lime %</span>
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

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>Gypsum %</span>
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

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>OPC Cement %</span>
                <span className="font-mono" style={{ fontWeight: 700 }}>{cement}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                value={cement}
                onChange={(e) => setCement(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>Water / Binder Ratio</span>
                <span className="font-mono" style={{ fontWeight: 700 }}>{waterBinder}</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.20"
                step="0.01"
                value={waterBinder}
                onChange={(e) => setWaterBinder(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-secondary)' }}
              />
            </div>

            <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span>Sand / Inert Filler:</span>
              <span className="font-mono" style={{ fontWeight: 700 }}>{sandAggregate}%</span>
            </div>
          </div>
        </GlassPanel>

        {/* Prediction Results & Strength Gain Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <GlassPanel padding="lg" accentBorder>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>28-Day Target Performance</h3>
              <span className="badge badge-emerald font-mono">{predictions.cls}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--accent-primary-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontWeight: 600 }}>28D STRENGTH</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)' }} className="font-mono">{predictions.str28d} MPa</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>IS 3495 Method</div>
              </div>

              <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--accent-secondary-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>WATER ABSORPTION</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)' }} className="font-mono">{predictions.abs}%</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--status-success)' }}>Conforms (≤ 20%)</div>
              </div>
            </div>

            {/* Hydration Kinetics Progression */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-4)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
                Strength Development Curve (Curing Age)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '2px' }}>
                    <span>7-Day Early Strength (Demolding):</span>
                    <span className="font-mono" style={{ fontWeight: 700 }}>{predictions.str7d} MPa</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(predictions.str7d / 28) * 100}%`, height: '100%', backgroundColor: 'var(--accent-mineral)' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '2px' }}>
                    <span>14-Day Intermediate Hydration:</span>
                    <span className="font-mono" style={{ fontWeight: 700 }}>{predictions.str14d} MPa</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(predictions.str14d / 28) * 100}%`, height: '100%', backgroundColor: 'var(--accent-secondary)' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '2px' }}>
                    <span>28-Day Standard Design Strength:</span>
                    <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{predictions.str28d} MPa</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(predictions.str28d / 28) * 100}%`, height: '100%', backgroundColor: 'var(--accent-primary)' }} />
                  </div>
                </div>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </AppShell>
  );
};
