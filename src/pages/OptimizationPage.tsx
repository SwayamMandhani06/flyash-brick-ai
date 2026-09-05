import React, { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { GlassPanel } from '../components/common/GlassPanel';
import { CheckCircle2 } from 'lucide-react';

export const OptimizationPage: React.FC = () => {
  const [minStrength, setMinStrength] = useState<number>(15);
  const [maxAbsorption, setMaxAbsorption] = useState<number>(12);
  const [objective, setObjective] = useState<'waste' | 'cost' | 'speed'>('waste');

  const candidates = [
    {
      id: 'OPT-01',
      rank: 1,
      title: 'High-Volume FaL-G (Recommended)',
      flyAsh: 65,
      lime: 18,
      gypsum: 5,
      cement: 0,
      sand: 12,
      str: 17.2,
      abs: 11.2,
      co2: '88% reduction',
      cost: '₹3.40 / brick',
      status: 'Optimal Pareto',
    },
    {
      id: 'OPT-02',
      rank: 2,
      title: 'Ultra High Fly Ash Infill',
      flyAsh: 72,
      lime: 14,
      gypsum: 4,
      cement: 0,
      sand: 10,
      str: 15.1,
      abs: 11.9,
      co2: '93% reduction',
      cost: '₹3.10 / brick',
      status: 'High Waste Util',
    },
    {
      id: 'OPT-03',
      rank: 3,
      title: 'Hybrid OPC Accelerated',
      flyAsh: 60,
      lime: 15,
      gypsum: 4,
      cement: 5,
      sand: 16,
      str: 19.4,
      abs: 10.1,
      co2: '68% reduction',
      cost: '₹3.85 / brick',
      status: 'Rapid Demold',
    },
  ];

  return (
    <AppShell
      title="04. Manufacturing Mix Optimizer Workstation"
      subtitle="Multi-objective Pareto optimization resolving non-linear trade-offs between fly ash utilization, clinker minimization, and structural strength."
      badge="Optimization Engine"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-8)',
          marginBottom: 'var(--space-8)',
        }}
      >
        {/* Objective & Constraint Config */}
        <GlassPanel padding="lg">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
            Optimization Objective & Constraints
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 'var(--space-2)' }}>
                Primary Optimization Goal:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
                <button
                  onClick={() => setObjective('waste')}
                  style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    fontWeight: objective === 'waste' ? 700 : 500,
                    backgroundColor: objective === 'waste' ? 'var(--accent-primary)' : 'var(--bg-surface)',
                    color: objective === 'waste' ? '#ffffff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-medium)',
                  }}
                >
                  Max Fly Ash
                </button>
                <button
                  onClick={() => setObjective('cost')}
                  style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    fontWeight: objective === 'cost' ? 700 : 500,
                    backgroundColor: objective === 'cost' ? 'var(--accent-mineral)' : 'var(--bg-surface)',
                    color: objective === 'cost' ? '#ffffff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-medium)',
                  }}
                >
                  Min Cost
                </button>
                <button
                  onClick={() => setObjective('speed')}
                  style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    fontWeight: objective === 'speed' ? 700 : 500,
                    backgroundColor: objective === 'speed' ? 'var(--accent-secondary)' : 'var(--bg-surface)',
                    color: objective === 'speed' ? '#ffffff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-medium)',
                  }}
                >
                  Early Strength
                </button>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>Target Strength</span>
                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>≥ {minStrength} MPa</span>
              </div>
              <input
                type="range"
                min="10"
                max="22"
                step="1"
                value={minStrength}
                onChange={(e) => setMinStrength(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>Max Water Absorption</span>
                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>≤ {maxAbsorption}%</span>
              </div>
              <input
                type="range"
                min="8"
                max="16"
                step="1"
                value={maxAbsorption}
                onChange={(e) => setMaxAbsorption(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-secondary)' }}
              />
            </div>
          </div>
        </GlassPanel>

        {/* Plant Batching Recipe Card */}
        <GlassPanel padding="lg" accentBorder>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <span className="badge badge-emerald font-mono">PLANT BATCH SHEET</span>
            <span className="badge badge-subtle font-mono">IS 12894: Class 15</span>
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            Factory Pan Mixer Prescription (per 500 Bricks)
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            Calculated for 230 × 110 × 70 mm standard modular brick dimensions at 20 MPa compaction pressure.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
            <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Fly Ash</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-primary)' }} className="font-mono">767 kg</div>
            </div>
            <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Lime</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-mineral)' }} className="font-mono">212 kg</div>
            </div>
            <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Gypsum</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-secondary)' }} className="font-mono">59 kg</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', backgroundColor: 'var(--accent-primary-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
            <CheckCircle2 size={16} color="var(--accent-primary)" />
            <span>Optimal water dosage: <strong>165 liters</strong> (W/B = 0.14)</span>
          </div>
        </GlassPanel>
      </div>

      {/* Candidate Formulations Pareto Table */}
      <GlassPanel padding="none" style={{ overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Pareto-Optimal Candidate Formulations</h4>
          <span className="badge badge-subtle font-mono">Ranked by Fitness Score</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-medium)' }}>
              <tr style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 16px' }}>Rank</th>
                <th style={{ padding: '10px' }}>Mix Strategy</th>
                <th style={{ padding: '10px' }}>FA %</th>
                <th style={{ padding: '10px' }}>Lime %</th>
                <th style={{ padding: '10px' }}>Gyp %</th>
                <th style={{ padding: '10px' }}>OPC %</th>
                <th style={{ padding: '10px' }}>Strength</th>
                <th style={{ padding: '10px' }}>Absorption</th>
                <th style={{ padding: '10px' }}>CO₂ Saving</th>
                <th style={{ padding: '10px 16px' }}>Cost Est.</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }} className="dataset-row">
                  <td style={{ padding: '10px 16px', fontWeight: 700 }}>#{c.rank}</td>
                  <td style={{ padding: '10px', fontWeight: 600, color: 'var(--text-primary)' }}>{c.title}</td>
                  <td style={{ padding: '10px', fontWeight: 700, color: 'var(--accent-primary)' }} className="font-mono">{c.flyAsh}%</td>
                  <td style={{ padding: '10px' }} className="font-mono">{c.lime}%</td>
                  <td style={{ padding: '10px' }} className="font-mono">{c.gypsum}%</td>
                  <td style={{ padding: '10px' }} className="font-mono">{c.cement}%</td>
                  <td style={{ padding: '10px', fontWeight: 700, color: 'var(--accent-primary)' }} className="font-mono">{c.str} MPa</td>
                  <td style={{ padding: '10px', fontWeight: 600, color: 'var(--accent-secondary)' }} className="font-mono">{c.abs}%</td>
                  <td style={{ padding: '10px', color: 'var(--status-success)', fontWeight: 600 }}>{c.co2}</td>
                  <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)' }}>{c.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassPanel>
    </AppShell>
  );
};
