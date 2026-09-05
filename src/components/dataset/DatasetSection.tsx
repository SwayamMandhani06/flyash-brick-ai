import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MOCK_FLY_ASH_DATASET } from '../../data/mockDataset';
import type { FlyAshMixRecord } from '../../types/dataset';
import { Button } from '../common/Button';
import { RecordDetailModal } from './RecordDetailModal';
import { ScatterPlotVisualizer } from './ScatterPlotVisualizer';
import { Search, ArrowUpDown, ExternalLink, Eye } from 'lucide-react';

export const DatasetSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [curingFilter, setCuringFilter] = useState<'all' | '7' | '14' | '28'>('all');
  const [minFlyAsh, setMinFlyAsh] = useState<number>(40);
  const [sortField, setSortField] = useState<keyof FlyAshMixRecord>('compressiveStrength');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FlyAshMixRecord | null>(null);

  // Filter & Sort Logic
  const filteredData = useMemo(() => {
    return MOCK_FLY_ASH_DATASET.filter((rec) => {
      const matchesSearch =
        rec.mixId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.paperId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCuring =
        curingFilter === 'all' || rec.curingDays === parseInt(curingFilter);

      const matchesFlyAsh = rec.flyAshPercent >= minFlyAsh;

      return matchesSearch && matchesCuring && matchesFlyAsh;
    }).sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [searchQuery, curingFilter, minFlyAsh, sortField, sortAsc]);

  const handleSort = (field: keyof FlyAshMixRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <section className="section" style={{ backgroundColor: 'var(--bg-surface-subtle)', position: 'relative' }}>
      <div className="container">
        {/* Editorial Section Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          <div>
            <div className="editorial-eyebrow" style={{ marginBottom: 'var(--space-2)' }}>
              Standardized Research Repository &bull; IS 12894 Schema
            </div>
            <h2 style={{ fontSize: 'clamp(1.85rem, 3vw + 0.5rem, 2.6rem)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              The Intelligent Benchmark Dataset
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '640px', marginTop: 'var(--space-2)' }}>
              Experimental mix designs extracted from peer-reviewed literature and normalized into a unified, reproducible feature space with stoichiometric verification.
            </p>
          </div>

          <Link to="/platform/dataset">
            <Button variant="outline" size="sm" icon={<ExternalLink size={14} />} iconPosition="right">
              View Complete 18-Record Explorer
            </Button>
          </Link>
        </div>

        {/* 1. Interactive Scatter Plot Correlation */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <ScatterPlotVisualizer />
        </div>

        {/* 2. Scientific Data Product Table */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-medium)',
            overflow: 'hidden',
          }}
        >
          {/* Scientific Filter Controls Bar */}
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderBottom: '1px solid var(--border-hairline)',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Search mix ID, author, DOI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.4rem 0.75rem 0.4rem 2rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.84rem',
                }}
              />
            </div>

            {/* Curing Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>Curing:</span>
              <select
                value={curingFilter}
                onChange={(e) => setCuringFilter(e.target.value as any)}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                }}
              >
                <option value="all">All Durations</option>
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
                <option value="28">28 Days (Std)</option>
              </select>
            </div>

            {/* Min Fly Ash Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                Min FA: <strong style={{ color: 'var(--accent-primary)' }}>{minFlyAsh}%</strong>
              </span>
              <input
                type="range"
                min="40"
                max="75"
                step="5"
                value={minFlyAsh}
                onChange={(e) => setMinFlyAsh(parseInt(e.target.value))}
                style={{ width: '80px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
            </div>

            <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              Showing <strong>{filteredData.length}</strong> of {MOCK_FLY_ASH_DATASET.length} mixes
            </span>
          </div>

          {/* Dense Scientific Table */}
          <div style={{ overflowX: 'auto', maxHeight: '460px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
              <thead
                style={{
                  position: 'sticky',
                  top: 0,
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderBottom: '2px solid var(--border-medium)',
                  zIndex: 2,
                }}
              >
                <tr style={{ color: 'var(--text-tertiary)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '10px 14px' }}>
                    <button onClick={() => handleSort('mixId')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'inherit' }}>
                      Mix ID <ArrowUpDown size={11} />
                    </button>
                  </th>
                  <th style={{ padding: '10px 12px' }}>Paper / Author</th>
                  <th style={{ padding: '10px 12px' }}>
                    <button onClick={() => handleSort('flyAshPercent')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'inherit' }}>
                      FA % <ArrowUpDown size={11} />
                    </button>
                  </th>
                  <th style={{ padding: '10px 12px' }}>Cement %</th>
                  <th style={{ padding: '10px 12px' }}>Lime %</th>
                  <th style={{ padding: '10px 12px' }}>Gyp %</th>
                  <th style={{ padding: '10px 12px' }}>Sand/Dust %</th>
                  <th style={{ padding: '10px 12px' }}>W/B</th>
                  <th style={{ padding: '10px 12px' }}>Curing</th>
                  <th style={{ padding: '10px 12px' }}>
                    <button onClick={() => handleSort('compressiveStrength')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'inherit' }}>
                      Strength (MPa) <ArrowUpDown size={11} />
                    </button>
                  </th>
                  <th style={{ padding: '10px 12px' }}>
                    <button onClick={() => handleSort('waterAbsorption')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'inherit' }}>
                      Abs % <ArrowUpDown size={11} />
                    </button>
                  </th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row) => (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom: '1px solid var(--border-hairline)',
                      transition: 'background-color 150ms ease',
                      cursor: 'pointer',
                    }}
                    className="dataset-row"
                    onClick={() => setSelectedRecord(row)}
                  >
                    <td style={{ padding: '9px 14px', fontWeight: 700, color: 'var(--accent-primary)' }} className="font-mono">
                      {row.mixId}
                    </td>
                    <td style={{ padding: '9px 12px', color: 'var(--text-secondary)' }}>
                      <div>{row.authors}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{row.year}</div>
                    </td>
                    <td style={{ padding: '9px 12px', fontWeight: 600, color: 'var(--text-primary)' }} className="font-mono">
                      {row.flyAshPercent}%
                    </td>
                    <td style={{ padding: '9px 12px', color: row.cementPercent === 0 ? 'var(--status-success)' : 'var(--text-primary)' }} className="font-mono">
                      {row.cementPercent === 0 ? '0% (FaL-G)' : `${row.cementPercent}%`}
                    </td>
                    <td style={{ padding: '9px 12px' }} className="font-mono">{row.limePercent}%</td>
                    <td style={{ padding: '9px 12px' }} className="font-mono">{row.gypsumPercent}%</td>
                    <td style={{ padding: '9px 12px' }} className="font-mono">{row.sandPercent + row.quarryDustPercent}%</td>
                    <td style={{ padding: '9px 12px' }} className="font-mono">{row.waterBinderRatio}</td>
                    <td style={{ padding: '9px 12px' }}>
                      <span className="badge badge-subtle font-mono" style={{ fontSize: '0.68rem' }}>
                        {row.curingDays}d
                      </span>
                    </td>
                    <td style={{ padding: '9px 12px', fontWeight: 700, color: 'var(--accent-primary)' }} className="font-mono">
                      {row.compressiveStrength}
                    </td>
                    <td style={{ padding: '9px 12px', fontWeight: 600, color: 'var(--accent-secondary)' }} className="font-mono">
                      {row.waterAbsorption}%
                    </td>
                    <td style={{ padding: '9px 14px', textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(row);
                        }}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: 'var(--bg-surface-subtle)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.74rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <RecordDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />

      <style>{`
        .dataset-row:hover {
          background-color: var(--accent-primary-subtle) !important;
        }
      `}</style>
    </section>
  );
};
