import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MOCK_FLY_ASH_DATASET } from '../../data/mockDataset';
import type { FlyAshMixRecord } from '../../types/dataset';
import { SectionHeading } from '../common/SectionHeading';
import { GlassPanel } from '../common/GlassPanel';
import { Button } from '../common/Button';
import { RecordDetailModal } from './RecordDetailModal';
import { Search, ArrowUpDown, ExternalLink, Eye, Info } from 'lucide-react';

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
      setSortAsc(false); // default to descending for numbers
    }
  };

  return (
    <section className="section" style={{ backgroundColor: 'var(--bg-surface-subtle)' }}>
      <div className="container">
        <SectionHeading
          badge="04 / BENCHMARK DATASET PREVIEW"
          badgeVariant="emerald"
          title="Curated Benchmark Dataset & Standardized Schema"
          highlightWords={['Benchmark Dataset', 'Standardized Schema']}
          description="A unified compilation of empirical brick formulation experiments extracted from peer-reviewed literature and normalized under IS 12894:2002 guidelines."
          align="left"
        />

        {/* Prominent Demo Notice */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--accent-mineral-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--accent-mineral-light)',
            marginBottom: 'var(--space-6)',
            fontSize: '0.85rem',
            color: 'var(--text-primary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Info size={16} color="var(--accent-mineral)" />
            <span>
              <strong>Demo Dataset:</strong> Displaying 18 verified academic formulations for interface evaluation and model prototyping.
            </span>
          </div>
          <span className="badge badge-amber font-mono" style={{ fontSize: '0.7rem' }}>
            SIMULATED BENCHMARK v0.1
          </span>
        </div>

        {/* Filter and Control Bar */}
        <GlassPanel padding="md" style={{ marginBottom: 'var(--space-4)' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-4)',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Search mix ID, author, or DOI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.85rem 0.5rem 2.25rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Curing Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>Curing:</span>
              <select
                value={curingFilter}
                onChange={(e) => setCuringFilter(e.target.value as any)}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              >
                <option value="all">All Durations</option>
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
                <option value="28">28 Days (Standard)</option>
              </select>
            </div>

            {/* Min Fly Ash Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>
                Min FA: <strong style={{ color: 'var(--accent-primary)' }}>{minFlyAsh}%</strong>
              </span>
              <input
                type="range"
                min="40"
                max="75"
                step="5"
                value={minFlyAsh}
                onChange={(e) => setMinFlyAsh(parseInt(e.target.value))}
                style={{ width: '90px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
            </div>

            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing <strong>{filteredData.length}</strong> of {MOCK_FLY_ASH_DATASET.length} mixes
            </span>
          </div>
        </GlassPanel>

        {/* Interactive Responsive Table Container */}
        <GlassPanel padding="none" style={{ overflow: 'hidden', border: '1px solid var(--border-medium)' }}>
          <div style={{ overflowX: 'auto', maxHeight: '520px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead
                style={{
                  position: 'sticky',
                  top: 0,
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderBottom: '2px solid var(--border-medium)',
                  zIndex: 2,
                }}
              >
                <tr style={{ color: 'var(--text-tertiary)', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 16px' }}>
                    <button onClick={() => handleSort('mixId')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'inherit' }}>
                      Mix ID <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th style={{ padding: '12px 12px' }}>Paper / Author</th>
                  <th style={{ padding: '12px 12px' }}>
                    <button onClick={() => handleSort('flyAshPercent')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'inherit' }}>
                      Fly Ash % <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th style={{ padding: '12px 12px' }}>Cement %</th>
                  <th style={{ padding: '12px 12px' }}>Lime %</th>
                  <th style={{ padding: '12px 12px' }}>Gypsum %</th>
                  <th style={{ padding: '12px 12px' }}>Sand/Dust %</th>
                  <th style={{ padding: '12px 12px' }}>W/B</th>
                  <th style={{ padding: '12px 12px' }}>Curing</th>
                  <th style={{ padding: '12px 12px' }}>
                    <button onClick={() => handleSort('compressiveStrength')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'inherit' }}>
                      Strength (MPa) <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th style={{ padding: '12px 12px' }}>
                    <button onClick={() => handleSort('waterAbsorption')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'inherit' }}>
                      Absorption % <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row) => (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 150ms ease',
                      cursor: 'pointer',
                    }}
                    className="dataset-row"
                    onClick={() => setSelectedRecord(row)}
                  >
                    <td style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--accent-primary)' }} className="font-mono">
                      {row.mixId}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                      <div>{row.authors}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{row.year}</div>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }} className="font-mono">
                      {row.flyAshPercent}%
                    </td>
                    <td style={{ padding: '10px 12px', color: row.cementPercent === 0 ? 'var(--status-success)' : 'var(--text-primary)' }} className="font-mono">
                      {row.cementPercent === 0 ? '0% (No OPC)' : `${row.cementPercent}%`}
                    </td>
                    <td style={{ padding: '10px 12px' }} className="font-mono">{row.limePercent}%</td>
                    <td style={{ padding: '10px 12px' }} className="font-mono">{row.gypsumPercent}%</td>
                    <td style={{ padding: '10px 12px' }} className="font-mono">{row.sandPercent + row.quarryDustPercent}%</td>
                    <td style={{ padding: '10px 12px' }} className="font-mono">{row.waterBinderRatio}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className="badge badge-subtle font-mono" style={{ fontSize: '0.7rem' }}>
                        {row.curingDays}d
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--accent-primary)' }} className="font-mono">
                      {row.compressiveStrength}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--accent-secondary)' }} className="font-mono">
                      {row.waterAbsorption}%
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(row);
                        }}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-surface-subtle)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Eye size={12} /> Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>

        {/* Footer Link to Dedicated Dataset Explorer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Dataset adheres to IS 12894:2002 testing protocols and stoichiometric balance.
          </span>
          <Link to="/platform/dataset">
            <Button variant="outline" size="sm" icon={<ExternalLink size={14} />} iconPosition="right">
              Open Full Dataset Explorer & CSV Export
            </Button>
          </Link>
        </div>
      </div>

      {/* Record Inspector Modal */}
      <RecordDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />

      <style>{`
        .dataset-row:hover {
          background-color: var(--accent-primary-subtle) !important;
        }
      `}</style>
    </section>
  );
};
