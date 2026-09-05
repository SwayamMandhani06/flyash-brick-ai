import React, { useState } from 'react';
import { MOCK_FLY_ASH_DATASET } from '../../data/mockDataset';
import type { FlyAshMixRecord } from '../../types/dataset';
import { Info } from 'lucide-react';

export const ScatterPlotVisualizer: React.FC = () => {
  const [filterMode, setFilterMode] = useState<'all' | '28d' | 'zero-opc'>('all');
  const [hoveredPoint, setHoveredPoint] = useState<FlyAshMixRecord | null>(null);

  const filteredPoints = MOCK_FLY_ASH_DATASET.filter((pt) => {
    if (filterMode === '28d') return pt.curingDays === 28;
    if (filterMode === 'zero-opc') return pt.cementPercent === 0;
    return true;
  });

  // Plot bounds
  const minX = 40;
  const maxX = 85;
  const minY = 4;
  const maxY = 28;

  const width = 680;
  const height = 340;
  const padLeft = 55;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 45;

  const getX = (fa: number) => {
    return padLeft + ((fa - minX) / (maxX - minX)) * (width - padLeft - padRight);
  };

  const getY = (str: number) => {
    return height - padBottom - ((str - minY) / (maxY - minY)) * (height - padTop - padBottom);
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-medium)',
        padding: 'var(--space-5)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Visualizer Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--accent-primary)',
              }}
            >
              INTERACTIVE SCATTER CORRELATION
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                padding: '0.15rem 0.45rem',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--accent-mineral-subtle)',
                color: 'var(--accent-mineral)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              DEMO DATA
            </span>
          </div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>
            Fly Ash Replacement Ratio vs. Compressive Strength
          </h4>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 'var(--space-1)', backgroundColor: 'var(--bg-surface-subtle)', padding: '2px', borderRadius: 'var(--radius-full)' }}>
          <button
            onClick={() => setFilterMode('all')}
            style={{
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.74rem',
              fontWeight: filterMode === 'all' ? 700 : 500,
              backgroundColor: filterMode === 'all' ? 'var(--bg-surface)' : 'transparent',
              color: filterMode === 'all' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: filterMode === 'all' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            All ({MOCK_FLY_ASH_DATASET.length})
          </button>
          <button
            onClick={() => setFilterMode('28d')}
            style={{
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.74rem',
              fontWeight: filterMode === '28d' ? 700 : 500,
              backgroundColor: filterMode === '28d' ? 'var(--bg-surface)' : 'transparent',
              color: filterMode === '28d' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: filterMode === '28d' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            28-Day Cured
          </button>
          <button
            onClick={() => setFilterMode('zero-opc')}
            style={{
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.74rem',
              fontWeight: filterMode === 'zero-opc' ? 700 : 500,
              backgroundColor: filterMode === 'zero-opc' ? 'var(--bg-surface)' : 'transparent',
              color: filterMode === 'zero-opc' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: filterMode === 'zero-opc' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Zero-OPC (FaL-G)
          </button>
        </div>
      </div>

      {/* Interactive SVG Plot */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '360px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {/* Subtle Grid Lines & Horizontal Axis Thresholds */}
          {[10, 15, 20, 25].map((str) => (
            <g key={`y-${str}`}>
              <line
                x1={padLeft}
                y1={getY(str)}
                x2={width - padRight}
                y2={getY(str)}
                stroke="var(--border-subtle)"
                strokeDasharray="3,3"
              />
              <text
                x={padLeft - 10}
                y={getY(str) + 4}
                textAnchor="end"
                fontSize="10"
                fill="var(--text-tertiary)"
              >
                {str} MPa
              </text>
            </g>
          ))}

          {/* Vertical Grid Lines */}
          {[45, 55, 65, 75, 80].map((fa) => (
            <g key={`x-${fa}`}>
              <line
                x1={getX(fa)}
                y1={padTop}
                x2={getX(fa)}
                y2={height - padBottom}
                stroke="var(--border-subtle)"
                strokeDasharray="3,3"
              />
              <text
                x={getX(fa)}
                y={height - padBottom + 18}
                textAnchor="middle"
                fontSize="10"
                fill="var(--text-tertiary)"
              >
                {fa}%
              </text>
            </g>
          ))}

          {/* Axis Labels */}
          <text
            x={width / 2}
            y={height - 8}
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill="var(--text-secondary)"
          >
            Fly Ash Replacement Ratio (%)
          </text>

          <text
            transform={`rotate(-90)`}
            x={-(height / 2)}
            y={16}
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill="var(--text-secondary)"
          >
            Compressive Strength (MPa)
          </text>

          {/* IS 12894 Reference Threshold Annotation Line (15 MPa) */}
          <line
            x1={padLeft}
            y1={getY(15)}
            x2={width - padRight}
            y2={getY(15)}
            stroke="var(--accent-primary)"
            strokeWidth="1.2"
            strokeOpacity="0.6"
          />
          <text
            x={width - padRight - 4}
            y={getY(15) - 6}
            textAnchor="end"
            fontSize="9"
            fill="var(--accent-primary)"
            fontWeight="700"
          >
            IS 12894 Class 15 Threshold (15.0 MPa)
          </text>

          {/* Plotted Literature Data Points */}
          {filteredPoints.map((pt) => {
            const cx = getX(pt.flyAshPercent);
            const cy = getY(pt.compressiveStrength);
            const isHovered = hoveredPoint?.id === pt.id;
            const isZeroOPC = pt.cementPercent === 0;

            return (
              <g key={pt.id}>
                {/* Outer Glow Ring on Hover */}
                {isHovered && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="12"
                    fill="var(--accent-primary-subtle)"
                    stroke="var(--accent-primary)"
                    strokeWidth="1.5"
                  />
                )}

                {/* Point Circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? '7' : '5'}
                  fill={isZeroOPC ? 'var(--accent-primary)' : 'var(--accent-secondary)'}
                  stroke="var(--bg-surface)"
                  strokeWidth="2"
                  style={{ cursor: 'pointer', transition: 'r 150ms ease' }}
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Floating Interactive Tooltip Strip */}
      <div
        style={{
          marginTop: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: 'var(--bg-surface-subtle)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-hairline)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-2)',
          fontSize: '0.8rem',
        }}
      >
        {hoveredPoint ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                {hoveredPoint.mixId}
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {hoveredPoint.authors} ({hoveredPoint.year})
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', fontFamily: 'var(--font-mono)' }}>
              <span>Fly Ash: <strong>{hoveredPoint.flyAshPercent}%</strong></span>
              <span>Strength: <strong style={{ color: 'var(--accent-primary)' }}>{hoveredPoint.compressiveStrength} MPa</strong></span>
              <span>Absorption: <strong>{hoveredPoint.waterAbsorption}%</strong></span>
              <span>Curing: <strong>{hoveredPoint.curingDays}d</strong></span>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-muted)' }}>
            <Info size={14} />
            <span>Hover any data point above to reveal literature mix parameters and IS 3495 strength results.</span>
          </div>
        )}
      </div>
    </div>
  );
};
