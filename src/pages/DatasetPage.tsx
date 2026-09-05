import React, { useState, useMemo } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { MOCK_FLY_ASH_DATASET } from '../data/mockDataset';
import type { FlyAshMixRecord } from '../types/dataset';
import { RecordDetailModal } from '../components/dataset/RecordDetailModal';
import { ScatterPlotVisualizer } from '../components/dataset/ScatterPlotVisualizer';
import { Download, Search, Eye, ArrowUpDown, Table, Activity } from 'lucide-react';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';

export const DatasetPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [curingFilter, setCuringFilter] = useState<'all' | '7' | '14' | '28'>('all');
  const [sortField, setSortField] = useState<keyof FlyAshMixRecord>('compressiveStrength');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FlyAshMixRecord | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'scatter'>('table');

  const filteredData = useMemo(() => {
    return MOCK_FLY_ASH_DATASET.filter((rec: FlyAshMixRecord) => {
      const matchesSearch =
        rec.mixId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.paperId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCuring = curingFilter === 'all' || rec.curingDays === parseInt(curingFilter);

      return matchesSearch && matchesCuring;
    }).sort((a: FlyAshMixRecord, b: FlyAshMixRecord) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [searchQuery, curingFilter, sortField, sortAsc]);

  const handleSort = (field: keyof FlyAshMixRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Paper ID',
      'Mix ID',
      'Authors',
      'Year',
      'Fly Ash %',
      'Cement %',
      'Lime %',
      'Gypsum %',
      'Sand %',
      'Quarry Dust %',
      'Water Binder Ratio',
      'Curing Days',
      'Compressive Strength (MPa)',
      'Water Absorption %',
      'IS 12894 Class',
    ];
    const rows = filteredData.map((r: FlyAshMixRecord) => [
      r.paperId,
      r.mixId,
      `"${r.authors}"`,
      r.year,
      r.flyAshPercent,
      r.cementPercent,
      r.limePercent,
      r.gypsumPercent,
      r.sandPercent,
      r.quarryDustPercent,
      r.waterBinderRatio,
      r.curingDays,
      r.compressiveStrength,
      r.waterAbsorption,
      r.is12894Class,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'fly_ash_benchmark_dataset_demo.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell
      title="02. Intelligent Benchmark Dataset Explorer"
      subtitle="Standardized experimental records extracted from peer-reviewed literature and normalized under canonical civil engineering schemas."
      badge="Benchmark Corpus"
      badgeVariant="emerald"
      actions={
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant={viewMode === 'table' ? 'primary' : 'outline'}
            size="sm"
            icon={<Table size={14} />}
            onClick={() => setViewMode('table')}
          >
            Tabular View
          </Button>
          <Button
            variant={viewMode === 'scatter' ? 'primary' : 'outline'}
            size="sm"
            icon={<Activity size={14} />}
            onClick={() => setViewMode('scatter')}
          >
            Scatter Visualizer
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Download size={14} />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
        </div>
      }
    >
      {/* Schema Attributes Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-5)',
        }}
      >
        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-hairline)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Standardized Records</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '2px' }} className="font-mono">{MOCK_FLY_ASH_DATASET.length}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Curated Literature Formulations</div>
        </div>

        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-hairline)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Strength Distribution</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '2px' }} className="font-mono">6.2 – 25.4</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>MPa (IS 3495 Compression)</div>
        </div>

        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-hairline)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Fly Ash Fraction</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-secondary)', marginTop: '2px' }} className="font-mono">48% – 80%</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Class F Indian Pozzolan</div>
        </div>

        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-hairline)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Standard Baseline</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-mineral)', marginTop: '2px' }} className="font-mono">IS 12894</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Stoichiometric Verification</div>
        </div>
      </div>

      {viewMode === 'scatter' ? (
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <ScatterPlotVisualizer />
        </div>
      ) : (
        <>
          {/* Filter Bar */}
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: 'var(--space-4)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Filter by Mix ID, Author, or DOI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  fontSize: '0.82rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>Curing:</span>
              <select
                value={curingFilter}
                onChange={(e) => setCuringFilter(e.target.value as any)}
                style={{
                  padding: '0.4rem 0.7rem',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                }}
              >
                <option value="all">All Curing Durations</option>
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
                <option value="28">28 Days (Standard)</option>
              </select>
            </div>

            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredData.length}</strong> canonical records
            </span>
          </div>

          {/* Full Dataset Table */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '2px solid var(--border-medium)' }}>
                  <tr style={{ color: 'var(--text-tertiary)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 14px' }}>
                      <button onClick={() => handleSort('mixId')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'inherit', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Mix ID <ArrowUpDown size={11} />
                      </button>
                    </th>
                    <th style={{ padding: '10px 12px' }}>Paper / DOI</th>
                    <th style={{ padding: '10px 12px' }}>
                      <button onClick={() => handleSort('flyAshPercent')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'inherit', background: 'none', border: 'none', cursor: 'pointer' }}>
                        FA % <ArrowUpDown size={11} />
                      </button>
                    </th>
                    <th style={{ padding: '10px 12px' }}>Lime %</th>
                    <th style={{ padding: '10px 12px' }}>Gyp %</th>
                    <th style={{ padding: '10px 12px' }}>OPC %</th>
                    <th style={{ padding: '10px 12px' }}>Sand %</th>
                    <th style={{ padding: '10px 12px' }}>W/B</th>
                    <th style={{ padding: '10px 12px' }}>Cure</th>
                    <th style={{ padding: '10px 12px' }}>
                      <button onClick={() => handleSort('compressiveStrength')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'inherit', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Strength (MPa) <ArrowUpDown size={11} />
                      </button>
                    </th>
                    <th style={{ padding: '10px 12px' }}>
                      <button onClick={() => handleSort('waterAbsorption')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'inherit', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Abs % <ArrowUpDown size={11} />
                      </button>
                    </th>
                    <th style={{ padding: '10px 12px' }}>IS Class</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row: FlyAshMixRecord) => (
                    <tr
                      key={row.id}
                      style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                      className="dataset-row"
                      onClick={() => setSelectedRecord(row)}
                    >
                      <td style={{ padding: '9px 14px', fontWeight: 700, color: 'var(--accent-primary)' }} className="font-mono">
                        {row.mixId}
                      </td>
                      <td style={{ padding: '9px 12px', fontSize: '0.76rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.authors} ({row.year})</div>
                        <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{row.paperId}</div>
                      </td>
                      <td style={{ padding: '9px 12px', fontWeight: 700, color: 'var(--accent-primary)' }} className="font-mono">{row.flyAshPercent}%</td>
                      <td style={{ padding: '9px 12px' }} className="font-mono">{row.limePercent}%</td>
                      <td style={{ padding: '9px 12px' }} className="font-mono">{row.gypsumPercent}%</td>
                      <td style={{ padding: '9px 12px' }} className="font-mono">{row.cementPercent}%</td>
                      <td style={{ padding: '9px 12px' }} className="font-mono">{row.sandPercent + row.quarryDustPercent}%</td>
                      <td style={{ padding: '9px 12px' }} className="font-mono">{row.waterBinderRatio}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <span className="badge badge-subtle font-mono" style={{ fontSize: '0.66rem' }}>{row.curingDays}d</span>
                      </td>
                      <td style={{ padding: '9px 12px', fontWeight: 800, color: 'var(--text-primary)' }} className="font-mono">
                        {row.compressiveStrength}
                      </td>
                      <td style={{ padding: '9px 12px', fontWeight: 600, color: 'var(--accent-secondary)' }} className="font-mono">
                        {row.waterAbsorption}%
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <span className="badge badge-emerald font-mono" style={{ fontSize: '0.66rem' }}>
                          {row.is12894Class}
                        </span>
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'right' }}>
                        <button
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            setSelectedRecord(row);
                          }}
                          style={{
                            padding: '3px 7px',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'var(--bg-surface-subtle)',
                            color: 'var(--text-secondary)',
                            fontSize: '0.72rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            border: '1px solid var(--border-hairline)',
                            cursor: 'pointer',
                          }}
                        >
                          <Eye size={11} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredData.length === 0 && (
              <EmptyState
                title="No Matching Formulations Found"
                description={`No literature mixes matched query "${searchQuery}" under ${curingFilter === 'all' ? 'all curing durations' : `${curingFilter}-day curing`}.`}
                actionLabel="Reset Search Filters"
                onAction={() => {
                  setSearchQuery('');
                  setCuringFilter('all');
                }}
              />
            )}
          </div>
        </>
      )}

      <RecordDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
    </AppShell>
  );
};
