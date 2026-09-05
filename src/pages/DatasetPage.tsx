import React, { useState, useMemo } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { GlassPanel } from '../components/common/GlassPanel';
import { Button } from '../components/common/Button';
import { MOCK_FLY_ASH_DATASET } from '../data/mockDataset';
import type { FlyAshMixRecord } from '../types/dataset';
import { RecordDetailModal } from '../components/dataset/RecordDetailModal';
import { Download, Search, Eye, ArrowUpDown } from 'lucide-react';

export const DatasetPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [curingFilter, setCuringFilter] = useState<'all' | '7' | '14' | '28'>('all');
  const [sortField, setSortField] = useState<keyof FlyAshMixRecord>('compressiveStrength');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FlyAshMixRecord | null>(null);

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
    const headers = ['Mix ID', 'Authors', 'Year', 'Fly Ash %', 'Cement %', 'Lime %', 'Gypsum %', 'Sand/Dust %', 'W/B', 'Curing Days', 'Strength (MPa)', 'Water Absorption %', 'IS Class'];
    const rows = filteredData.map((r: FlyAshMixRecord) => [
      r.mixId,
      `"${r.authors}"`,
      r.year,
      r.flyAshPercent,
      r.cementPercent,
      r.limePercent,
      r.gypsumPercent,
      r.sandPercent + r.quarryDustPercent,
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
      subtitle="Curated, standardized experimental records derived from published civil and materials science research literature."
      badge="Benchmark Corpus"
      actions={
        <Button variant="primary" size="sm" icon={<Download size={14} />} onClick={handleExportCSV}>
          Export CSV (Demo)
        </Button>
      }
    >
      {/* Schema Attributes Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Records</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '2px' }} className="font-mono">{MOCK_FLY_ASH_DATASET.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Curated Literature Mixes</div>
        </div>

        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Strength Range</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '2px' }} className="font-mono">6.2 – 25.4</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MPa (IS 3495 Part 1)</div>
        </div>

        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Fly Ash Replacement</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-secondary)', marginTop: '2px' }} className="font-mono">48% – 80%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Class F Pozzolana</div>
        </div>

        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Standards Conformance</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-mineral)', marginTop: '2px' }} className="font-mono">IS 12894</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified Schema</div>
        </div>
      </div>

      {/* Filter Bar */}
      <GlassPanel padding="md" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by Mix ID, Author, or DOI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.85rem 0.5rem 2.25rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-surface)',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>Curing Days:</span>
            <select
              value={curingFilter}
              onChange={(e) => setCuringFilter(e.target.value as any)}
              style={{
                padding: '0.45rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="all">All Curing Durations</option>
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="28">28 Days (Standard)</option>
            </select>
          </div>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredData.length}</strong> items
          </span>
        </div>
      </GlassPanel>

      {/* Full Dataset Table */}
      <GlassPanel padding="none" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '2px solid var(--border-medium)' }}>
              <tr style={{ color: 'var(--text-tertiary)', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>
                  <button onClick={() => handleSort('mixId')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'inherit' }}>
                    Mix ID <ArrowUpDown size={12} />
                  </button>
                </th>
                <th style={{ padding: '12px' }}>Paper DOI / Source</th>
                <th style={{ padding: '12px' }}>
                  <button onClick={() => handleSort('flyAshPercent')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'inherit' }}>
                    FA % <ArrowUpDown size={12} />
                  </button>
                </th>
                <th style={{ padding: '12px' }}>Cement %</th>
                <th style={{ padding: '12px' }}>Lime %</th>
                <th style={{ padding: '12px' }}>Gyp %</th>
                <th style={{ padding: '12px' }}>Sand %</th>
                <th style={{ padding: '12px' }}>W/B</th>
                <th style={{ padding: '12px' }}>Cure</th>
                <th style={{ padding: '12px' }}>
                  <button onClick={() => handleSort('compressiveStrength')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'inherit' }}>
                    Strength (MPa) <ArrowUpDown size={12} />
                  </button>
                </th>
                <th style={{ padding: '12px' }}>
                  <button onClick={() => handleSort('waterAbsorption')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'inherit' }}>
                    Abs % <ArrowUpDown size={12} />
                  </button>
                </th>
                <th style={{ padding: '12px' }}>IS Class</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
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
                  <td style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--accent-primary)' }} className="font-mono">
                    {row.mixId}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '0.78rem' }}>
                    <div style={{ fontWeight: 600 }}>{row.authors} ({row.year})</div>
                    <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{row.paperId}</div>
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }} className="font-mono">{row.flyAshPercent}%</td>
                  <td style={{ padding: '10px 12px' }} className="font-mono">{row.cementPercent}%</td>
                  <td style={{ padding: '10px 12px' }} className="font-mono">{row.limePercent}%</td>
                  <td style={{ padding: '10px 12px' }} className="font-mono">{row.gypsumPercent}%</td>
                  <td style={{ padding: '10px 12px' }} className="font-mono">{row.sandPercent + row.quarryDustPercent}%</td>
                  <td style={{ padding: '10px 12px' }} className="font-mono">{row.waterBinderRatio}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className="badge badge-subtle font-mono" style={{ fontSize: '0.68rem' }}>{row.curingDays}d</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--accent-primary)' }} className="font-mono">
                    {row.compressiveStrength}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--accent-secondary)' }} className="font-mono">
                    {row.waterAbsorption}%
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className="badge badge-emerald font-mono" style={{ fontSize: '0.68rem' }}>
                      {row.is12894Class}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                    <button
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setSelectedRecord(row);
                      }}
                      style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface-subtle)', color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassPanel>

      <RecordDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
    </AppShell>
  );
};
