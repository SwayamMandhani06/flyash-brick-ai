import React, { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { ParetoConvergenceVisualizer } from '../components/optimization/ParetoConvergenceVisualizer';
import type { ParetoPoint } from '../components/optimization/ParetoConvergenceVisualizer';
import { CheckCircle2, Leaf, ShieldAlert, Sliders, Download } from 'lucide-react';
import { Button } from '../components/common/Button';

export const OptimizationPage: React.FC = () => {
  const [minStrength, setMinStrength] = useState<number>(15);
  const [maxAbsorption, setMaxAbsorption] = useState<number>(12);
  const [objective, setObjective] = useState<'waste' | 'cost' | 'speed'>('waste');
  const [selectedMixId, setSelectedMixId] = useState<string>('OPT-01');

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
      batchWeight: '767 kg FA / 212 kg Lime / 59 kg Gyp',
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
      batchWeight: '850 kg FA / 165 kg Lime / 47 kg Gyp',
    },
    {
      id: 'OPT-03',
      rank: 3,
      title: 'Hybrid OPC Accelerated',
      flyAsh: 58,
      lime: 15,
      gypsum: 4,
      cement: 5,
      sand: 18,
      str: 21.4,
      abs: 9.8,
      co2: '68% reduction',
      cost: '₹3.85 / brick',
      status: 'Rapid Demold',
      batchWeight: '684 kg FA / 177 kg Lime / 59 kg OPC',
    },
    {
      id: 'OPT-04',
      rank: 4,
      title: 'Structural Heavy-Duty Unit',
      flyAsh: 50,
      lime: 18,
      gypsum: 5,
      cement: 8,
      sand: 19,
      str: 24.2,
      abs: 8.9,
      co2: '58% reduction',
      cost: '₹4.20 / brick',
      status: 'Class 20 Heavy',
      batchWeight: '590 kg FA / 212 kg Lime / 94 kg OPC',
    },
  ];

  const currentMix = candidates.find((c) => c.id === selectedMixId) || candidates[0];

  const handleSelectFromPlot = (pt: ParetoPoint) => {
    setSelectedMixId(pt.id);
  };

  return (
    <AppShell
      title="04. Manufacturing Mix Optimizer Workstation"
      subtitle="Multi-objective Pareto formulation solver balancing fly ash utilization, clinker minimization, and structural resistance."
      badge="Optimization Workstation"
      actions={
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant="outline"
            size="sm"
            icon={<Download size={14} />}
            onClick={() => alert('Batch prescription exported to printable PDF sheet (demo).')}
          >
            Export Batch Sheet
          </Button>
        </div>
      }
    >
      {/* Top Workstation Status Strip */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-6)',
          fontSize: '0.8rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-primary)' }}>
            <Sliders size={15} color="var(--accent-primary)" /> Solver Engine:
            <span className="font-mono" style={{ color: 'var(--accent-primary)' }}>NSGA-II Multi-Objective</span>
          </span>
          <span style={{ color: 'var(--text-tertiary)' }}>•</span>
          <span style={{ color: 'var(--text-secondary)' }}>
            Search Space: <strong className="font-mono">1,420 Vectors</strong>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span className="badge badge-subtle font-mono" style={{ fontSize: '0.7rem' }}>
            Reference: IS 12894:2002
          </span>
          <span className="badge badge-teal font-mono" style={{ fontSize: '0.7rem' }}>
            DEMO ENGINE
          </span>
        </div>
      </div>

      {/* Main Workstation 2-Column Split: Controls + Pareto Curve & Batch Sheet */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 380px) 1fr',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-8)',
        }}
        className="opt-page-grid"
      >
        {/* Left Column: Objectives & Constraints Form */}
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
            <span className="editorial-eyebrow" style={{ fontSize: '0.68rem' }}>SEARCH OBJECTIVES</span>
            <h3 style={{ fontSize: '1.18rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>
              Optimization Strategy
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Select trade-off priority function to bias Pareto selection.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
            <button
              onClick={() => setObjective('waste')}
              style={{
                padding: '8px 4px',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.78rem',
                fontWeight: objective === 'waste' ? 700 : 500,
                backgroundColor: objective === 'waste' ? 'var(--accent-primary)' : 'var(--bg-surface-subtle)',
                color: objective === 'waste' ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid ' + (objective === 'waste' ? 'var(--accent-primary)' : 'var(--border-hairline)'),
                cursor: 'pointer',
              }}
            >
              Max Fly Ash
            </button>
            <button
              onClick={() => setObjective('cost')}
              style={{
                padding: '8px 4px',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.78rem',
                fontWeight: objective === 'cost' ? 700 : 500,
                backgroundColor: objective === 'cost' ? 'var(--accent-mineral)' : 'var(--bg-surface-subtle)',
                color: objective === 'cost' ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid ' + (objective === 'cost' ? 'var(--accent-mineral)' : 'var(--border-hairline)'),
                cursor: 'pointer',
              }}
            >
              Min Cost
            </button>
            <button
              onClick={() => setObjective('speed')}
              style={{
                padding: '8px 4px',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.78rem',
                fontWeight: objective === 'speed' ? 700 : 500,
                backgroundColor: objective === 'speed' ? 'var(--accent-secondary)' : 'var(--bg-surface-subtle)',
                color: objective === 'speed' ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid ' + (objective === 'speed' ? 'var(--accent-secondary)' : 'var(--border-hairline)'),
                cursor: 'pointer',
              }}
            >
              Early Strength
            </button>
          </div>

          <div className="hairline-divider" />

          {/* Target Strength Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Target Compressive Strength</span>
              <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                ≥ {minStrength} MPa
              </span>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              <span>10 MPa (Class 10)</span>
              <span>15 MPa (Class 15)</span>
              <span>20 MPa (Class 20)</span>
            </div>
          </div>

          {/* Max Absorption Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Maximum Water Absorption</span>
              <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>
                ≤ {maxAbsorption}%
              </span>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              <span>8% (Impermeable)</span>
              <span>12% (Standard)</span>
              <span>16% (Upper limit)</span>
            </div>
          </div>

          <div className="hairline-divider" />

          {/* Plant Batching Summary */}
          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-hairline)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>ACTIVE SELECTION:</span>
              <span className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{currentMix.id}</span>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {currentMix.title}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              Pan Mix: {currentMix.batchWeight}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Pareto Convergence Visualizer & Plant Specification */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <ParetoConvergenceVisualizer
            targetStrength={minStrength}
            maxAbsorption={maxAbsorption}
            selectedMixId={selectedMixId}
            onSelectMix={handleSelectFromPlot}
          />

          {/* Plant Mixer Prescription Details */}
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
                <span className="editorial-eyebrow" style={{ fontSize: '0.68rem' }}>PRODUCTION SPECIFICATION</span>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Pan Mixer Prescription (per 500 Bricks)
                </h4>
              </div>
              <span className="badge badge-emerald font-mono" style={{ fontSize: '0.72rem' }}>
                Modular Format: 230 × 110 × 70 mm
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border-hairline)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Fly Ash (Dry)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)' }} className="font-mono">{currentMix.flyAsh}%</div>
              </div>
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border-hairline)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Hydrated Lime</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-mineral)' }} className="font-mono">{currentMix.lime}%</div>
              </div>
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border-hairline)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Gypsum</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-secondary)' }} className="font-mono">{currentMix.gypsum}%</div>
              </div>
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border-hairline)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Sand / Filler</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }} className="font-mono">{currentMix.sand}%</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--accent-primary-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <CheckCircle2 size={16} color="var(--accent-primary)" />
                <span>Optimal water dosage: <strong>165 liters</strong> (Water/Binder = 0.14)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-success)', fontWeight: 700 }}>
                <Leaf size={14} /> Embodied CO₂: {currentMix.co2}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Candidate Formulations Pareto Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--border-hairline)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-2)',
          }}
        >
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Evaluated Pareto Candidate Formulations
            </h4>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Click any candidate row to load its plant batch prescription into the workstation.
            </div>
          </div>
          <span className="badge badge-subtle font-mono" style={{ fontSize: '0.72rem' }}>
            Sorted by Multi-Objective Fitness
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-medium)' }}>
              <tr style={{ color: 'var(--text-tertiary)', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 16px' }}>Rank</th>
                <th style={{ padding: '10px' }}>Mix Strategy</th>
                <th style={{ padding: '10px' }}>FA %</th>
                <th style={{ padding: '10px' }}>Lime %</th>
                <th style={{ padding: '10px' }}>Gyp %</th>
                <th style={{ padding: '10px' }}>OPC %</th>
                <th style={{ padding: '10px' }}>28D Strength</th>
                <th style={{ padding: '10px' }}>Absorption</th>
                <th style={{ padding: '10px' }}>CO₂ Saving</th>
                <th style={{ padding: '10px 16px' }}>Cost Est.</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => {
                const isSelected = c.id === selectedMixId;
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedMixId(c.id)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? 'var(--accent-primary-subtle)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 150ms ease',
                    }}
                    className="dataset-row"
                  >
                    <td style={{ padding: '10px 16px', fontWeight: 700, color: isSelected ? 'var(--accent-primary)' : 'inherit' }}>
                      #{c.rank}
                    </td>
                    <td style={{ padding: '10px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {c.title}
                      {isSelected && <span style={{ marginLeft: '8px', fontSize: '0.68rem', color: 'var(--accent-primary)' }}>● Active</span>}
                    </td>
                    <td style={{ padding: '10px', fontWeight: 700, color: 'var(--accent-primary)' }} className="font-mono">{c.flyAsh}%</td>
                    <td style={{ padding: '10px' }} className="font-mono">{c.lime}%</td>
                    <td style={{ padding: '10px' }} className="font-mono">{c.gypsum}%</td>
                    <td style={{ padding: '10px' }} className="font-mono">{c.cement}%</td>
                    <td style={{ padding: '10px', fontWeight: 700, color: 'var(--accent-primary)' }} className="font-mono">{c.str} MPa</td>
                    <td style={{ padding: '10px', fontWeight: 600, color: 'var(--accent-secondary)' }} className="font-mono">{c.abs}%</td>
                    <td style={{ padding: '10px', color: 'var(--status-success)', fontWeight: 600 }}>{c.co2}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)' }}>{c.cost}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
        <ShieldAlert size={14} />
        <span>
          <strong>Research Context Note:</strong> All optimization results are generated by surrogate computational models calibrated on published experimental data. Final batch production should undergo factory pilot curing verification according to IS 3495 procedures.
        </span>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .opt-page-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </AppShell>
  );
};
