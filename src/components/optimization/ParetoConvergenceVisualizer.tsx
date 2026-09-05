import React, { useState } from 'react';

export interface ParetoPoint {
  id: string;
  name: string;
  flyAsh: number; // 40 - 80%
  strength: number; // 8 - 25 MPa
  absorption: number; // 8 - 18%
  cost: number; // Rs
  co2Reduction: string;
  isPareto: boolean;
  isFeasible: boolean;
  isSelected?: boolean;
}

interface ParetoConvergenceVisualizerProps {
  targetStrength: number;
  maxAbsorption: number;
  isSearching?: boolean;
  selectedMixId?: string;
  onSelectMix?: (point: ParetoPoint) => void;
}

// Fixed representative candidate population generated from empirical parameter bounds
const CANDIDATE_POPULATION: ParetoPoint[] = [
  // Pareto frontier (optimal trade-offs)
  { id: 'OPT-01', name: 'Balanced FaL-G (Recommended)', flyAsh: 65, strength: 17.2, absorption: 11.2, cost: 3.40, co2Reduction: '88%', isPareto: true, isFeasible: true },
  { id: 'OPT-02', name: 'Ultra High-Volume FA', flyAsh: 72, strength: 15.1, absorption: 11.9, cost: 3.10, co2Reduction: '93%', isPareto: true, isFeasible: true },
  { id: 'OPT-03', name: 'Hybrid OPC Accelerated', flyAsh: 58, strength: 21.4, absorption: 9.8, cost: 3.85, co2Reduction: '68%', isPareto: true, isFeasible: true },
  { id: 'OPT-04', name: 'High-Strength Structural', flyAsh: 50, strength: 24.2, absorption: 8.9, cost: 4.20, co2Reduction: '58%', isPareto: true, isFeasible: true },
  { id: 'OPT-05', name: 'Max Waste Infill', flyAsh: 78, strength: 11.8, absorption: 14.2, cost: 2.85, co2Reduction: '96%', isPareto: true, isFeasible: true },

  // Interior feasible points
  { id: 'FEAS-01', name: 'Standard FaL-G Mix A', flyAsh: 60, strength: 15.6, absorption: 12.1, cost: 3.60, co2Reduction: '78%', isPareto: false, isFeasible: true },
  { id: 'FEAS-02', name: 'Standard FaL-G Mix B', flyAsh: 62, strength: 14.8, absorption: 12.8, cost: 3.50, co2Reduction: '81%', isPareto: false, isFeasible: true },
  { id: 'FEAS-03', name: 'Quarry Dust Blend', flyAsh: 55, strength: 18.2, absorption: 10.6, cost: 3.90, co2Reduction: '72%', isPareto: false, isFeasible: true },
  { id: 'FEAS-04', name: 'High Lime Ratio', flyAsh: 52, strength: 19.5, absorption: 10.2, cost: 4.10, co2Reduction: '65%', isPareto: false, isFeasible: true },
  { id: 'FEAS-05', name: 'Low Binder Ratio', flyAsh: 70, strength: 12.9, absorption: 13.5, cost: 3.20, co2Reduction: '89%', isPareto: false, isFeasible: true },
  { id: 'FEAS-06', name: 'Steam-Cured Equivalent', flyAsh: 66, strength: 16.0, absorption: 11.5, cost: 3.45, co2Reduction: '86%', isPareto: false, isFeasible: true },

  // Non-feasible / dominated candidate points
  { id: 'DOM-01', name: 'Excess Water Mix', flyAsh: 65, strength: 9.8, absorption: 16.8, cost: 3.35, co2Reduction: '88%', isPareto: false, isFeasible: false },
  { id: 'DOM-02', name: 'Insufficient Lime Binder', flyAsh: 75, strength: 8.4, absorption: 17.5, cost: 2.95, co2Reduction: '94%', isPareto: false, isFeasible: false },
  { id: 'DOM-03', name: 'Over-Sanded Formulation', flyAsh: 45, strength: 13.2, absorption: 14.2, cost: 3.90, co2Reduction: '52%', isPareto: false, isFeasible: false },
  { id: 'DOM-04', name: 'Imbalanced Sulfate System', flyAsh: 58, strength: 12.0, absorption: 15.0, cost: 3.75, co2Reduction: '74%', isPareto: false, isFeasible: false },
  { id: 'DOM-05', name: 'High OPC Low Pozzolan', flyAsh: 42, strength: 18.0, absorption: 11.0, cost: 4.80, co2Reduction: '42%', isPareto: false, isFeasible: false },
];

export const ParetoConvergenceVisualizer: React.FC<ParetoConvergenceVisualizerProps> = ({
  targetStrength,
  maxAbsorption,
  isSearching = false,
  selectedMixId = 'OPT-01',
  onSelectMix,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<ParetoPoint | null>(null);

  // Plot bounds
  const minFA = 38;
  const maxFA = 82;
  const minStr = 6;
  const maxStr = 26;

  // SVG coordinate dimensions
  const svgWidth = 560;
  const svgHeight = 310;
  const padLeft = 52;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 46;

  const getX = (fa: number) => {
    return padLeft + ((fa - minFA) / (maxFA - minFA)) * (svgWidth - padLeft - padRight);
  };

  const getY = (str: number) => {
    return svgHeight - padBottom - ((str - minStr) / (maxStr - minStr)) * (svgHeight - padTop - padBottom);
  };

  // Target strength line Y
  const targetY = getY(targetStrength);

  // Filter candidates dynamic feasibility based on user targets
  const pointsWithFeasibility = CANDIDATE_POPULATION.map((pt) => {
    const isFeasibleWithTarget = pt.strength >= targetStrength && pt.absorption <= maxAbsorption;
    return {
      ...pt,
      isFeasible: isFeasibleWithTarget,
      isSelected: pt.id === selectedMixId,
    };
  });

  // Sort Pareto points to form connected Pareto frontier curve
  const paretoPoints = pointsWithFeasibility
    .filter((pt) => pt.isPareto)
    .sort((a, b) => a.flyAsh - b.flyAsh);

  const paretoPath = paretoPoints.reduce((acc, pt, idx) => {
    const x = getX(pt.flyAsh);
    const y = getY(pt.strength);
    return idx === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`;
  }, '');

  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        overflow: 'hidden',
      }}
    >
      {/* Visualizer Top Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-3)',
          paddingBottom: 'var(--space-3)',
          borderBottom: '1px solid var(--border-hairline)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isSearching ? 'var(--accent-secondary)' : 'var(--accent-primary)',
            }}
            className={isSearching ? 'animate-pulse-subtle' : ''}
          />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
            PARETO CONVERGENCE FRONTIER
          </span>
          <span
            style={{
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-hairline)',
              color: 'var(--text-tertiary)',
            }}
          >
            Multi-Objective Space
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: '0.72rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Pareto Optimal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-secondary)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Feasible</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--text-muted)', opacity: 0.4 }} />
            <span style={{ color: 'var(--text-tertiary)' }}>Suboptimal / Infeasible</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          aria-label="Pareto formulation optimization convergence scatter plot"
        >
          <defs>
            {/* Gradient for Pareto area fill */}
            <linearGradient id="paretoAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.14" />
              <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.01" />
            </linearGradient>

            {/* Target zone fill */}
            <linearGradient id="feasibleZoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--status-success)" stopOpacity="0.05" />
              <stop offset="100%" stopColor="var(--status-success)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Feasible target zone fill (above target strength) */}
          {targetY > padTop && (
            <rect
              x={padLeft}
              y={padTop}
              width={svgWidth - padLeft - padRight}
              height={Math.max(0, targetY - padTop)}
              fill="url(#feasibleZoneGrad)"
            />
          )}

          {/* Grid lines: FA axis (X) */}
          {[40, 50, 60, 70, 80].map((fa) => {
            const x = getX(fa);
            return (
              <g key={`x-grid-${fa}`}>
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={svgHeight - padBottom}
                  stroke="var(--border-hairline)"
                  strokeDasharray="3 3"
                />
                <text
                  x={x}
                  y={svgHeight - padBottom + 16}
                  fill="var(--text-tertiary)"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                  textAnchor="middle"
                >
                  {fa}%
                </text>
              </g>
            );
          })}

          {/* Grid lines: Strength axis (Y) */}
          {[10, 15, 20, 25].map((str) => {
            const y = getY(str);
            return (
              <g key={`y-grid-${str}`}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="var(--border-hairline)"
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3}
                  fill="var(--text-tertiary)"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                  textAnchor="end"
                >
                  {str}
                </text>
              </g>
            );
          })}

          {/* Target Strength Constraint Horizontal Line */}
          <line
            x1={padLeft}
            y1={targetY}
            x2={svgWidth - padRight}
            y2={targetY}
            stroke="var(--accent-secondary)"
            strokeWidth="1.5"
            strokeDasharray="5 4"
          />
          <text
            x={svgWidth - padRight - 6}
            y={targetY - 5}
            fill="var(--accent-secondary)"
            fontSize="9.5"
            fontFamily="var(--font-mono)"
            fontWeight="700"
            textAnchor="end"
          >
            TARGET ≥ {targetStrength} MPa
          </text>

          {/* Pareto Frontier Connected Curve */}
          <path
            d={paretoPath}
            fill="none"
            stroke="var(--accent-primary)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
          />

          {/* Candidate Points Scatter */}
          {pointsWithFeasibility.map((pt) => {
            const cx = getX(pt.flyAsh);
            const cy = getY(pt.strength);
            const isHovered = hoveredPoint?.id === pt.id;
            const isSelected = pt.isSelected;

            let fillColor = 'var(--text-muted)';
            let fillOpacity = 0.35;
            let radius = 4;
            let strokeColor = 'transparent';
            let strokeWidth = 0;

            if (pt.isPareto && pt.isFeasible) {
              fillColor = 'var(--accent-primary)';
              fillOpacity = 0.95;
              radius = 5.5;
              strokeColor = 'var(--bg-surface)';
              strokeWidth = 2;
            } else if (pt.isFeasible) {
              fillColor = 'var(--accent-secondary)';
              fillOpacity = 0.85;
              radius = 4.5;
            }

            if (isSelected) {
              radius = 7.5;
              strokeColor = 'var(--accent-primary)';
              strokeWidth = 2.5;
              fillColor = 'var(--accent-primary)';
              fillOpacity = 1;
            }

            return (
              <g
                key={pt.id}
                style={{ cursor: 'pointer', transition: 'all 200ms ease' }}
                onClick={() => onSelectMix && onSelectMix(pt)}
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Outer halo when selected or hovered */}
                {(isSelected || isHovered) && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius + 6}
                    fill="var(--accent-primary)"
                    fillOpacity="0.18"
                    className="animate-pulse-subtle"
                  />
                )}

                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill={fillColor}
                  fillOpacity={fillOpacity}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                />

                {/* Pareto Frontier Point Label */}
                {pt.isPareto && pt.isFeasible && (
                  <text
                    x={cx}
                    y={cy - 9}
                    fill="var(--text-primary)"
                    fontSize="9"
                    fontFamily="var(--font-mono)"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {pt.flyAsh}%
                  </text>
                )}
              </g>
            );
          })}

          {/* Axis Titles */}
          <text
            x={padLeft + (svgWidth - padLeft - padRight) / 2}
            y={svgHeight - 8}
            fill="var(--text-secondary)"
            fontSize="10.5"
            fontWeight="600"
            textAnchor="middle"
          >
            Fly Ash Replacement Ratio (%) → Maximize Waste Utilization
          </text>

          <text
            x={16}
            y={padTop + (svgHeight - padTop - padBottom) / 2}
            fill="var(--text-secondary)"
            fontSize="10.5"
            fontWeight="600"
            textAnchor="middle"
            transform={`rotate(-90, 16, ${padTop + (svgHeight - padTop - padBottom) / 2})`}
          >
            28-Day Strength (MPa) →
          </text>
        </svg>

        {/* Dynamic Tooltip on Hover */}
        {hoveredPoint && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-md)',
              fontSize: '0.75rem',
              pointerEvents: 'none',
              zIndex: 10,
              maxWidth: '220px',
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
              {hoveredPoint.name}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              <span>Fly Ash:</span>
              <strong style={{ color: 'var(--accent-primary)' }}>{hoveredPoint.flyAsh}%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              <span>28D Strength:</span>
              <strong>{hoveredPoint.strength} MPa</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              <span>Absorption:</span>
              <strong>{hoveredPoint.absorption}%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              <span>CO₂ Saved:</span>
              <strong style={{ color: 'var(--status-success)' }}>{hoveredPoint.co2Reduction}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Footer Subtext */}
      <div
        style={{
          marginTop: 'var(--space-2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.72rem',
          color: 'var(--text-tertiary)',
        }}
      >
        <span>
          <strong style={{ color: 'var(--text-secondary)' }}>Pareto Curve:</strong> Non-dominated trade-offs between fly ash % and compressive resistance.
        </span>
        <span className="font-mono" style={{ fontSize: '0.68rem' }}>
          DEMO ENGINE • Illustrative Space
        </span>
      </div>
    </div>
  );
};
