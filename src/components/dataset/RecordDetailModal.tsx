import React from 'react';
import type { FlyAshMixRecord } from '../../types/dataset';
import { GlassPanel } from '../common/GlassPanel';
import { X, FileText } from 'lucide-react';
import { Button } from '../common/Button';

interface RecordDetailModalProps {
  record: FlyAshMixRecord | null;
  onClose: () => void;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({ record, onClose }) => {
  if (!record) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--bg-overlay)',
        backdropFilter: 'blur(4px)',
        zIndex: 'var(--z-modal)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        animation: 'fadeIn 200ms ease forwards',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <GlassPanel elevation="high" padding="lg" accentBorder style={{ backgroundColor: 'var(--bg-surface)' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
                <span className="badge badge-emerald font-mono">{record.mixId}</span>
                <span className="badge badge-subtle">{record.is12894Class}</span>
                <span
                  className="badge font-mono"
                  style={{
                    backgroundColor: record.validationStatus === 'Verified' ? 'var(--status-success-bg)' : 'var(--status-warning-bg)',
                    color: record.validationStatus === 'Verified' ? 'var(--status-success)' : 'var(--status-warning)',
                  }}
                >
                  {record.validationStatus}
                </span>
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Mix Formulation Record Details
              </h3>
            </div>
            <button
              onClick={onClose}
              aria-label="Close modal"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-surface-subtle)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Academic Source Reference */}
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-subtle)',
              marginBottom: 'var(--space-6)',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>
              <FileText size={14} />
              <span>Literature Source DOI:</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-primary)' }}>
              {record.paperId}
            </div>
            <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
              Authors: {record.authors} ({record.year})
            </div>
          </div>

          {/* Constituent Proportions Breakdown (Dry Mass %) */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>
              Batch Constituents (Dry Mass %)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 'var(--space-2)' }}>
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Fly Ash</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }} className="font-mono">{record.flyAshPercent}%</div>
              </div>
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Lime (CaO)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }} className="font-mono">{record.limePercent}%</div>
              </div>
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Gypsum</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }} className="font-mono">{record.gypsumPercent}%</div>
              </div>
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cement (OPC)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }} className="font-mono">{record.cementPercent}%</div>
              </div>
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sand / Dust</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }} className="font-mono">{record.sandPercent + record.quarryDustPercent}%</div>
              </div>
            </div>
          </div>

          {/* Physical & Mechanical Properties */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>
              Standardized Mechanical & Durability Performance
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)' }}>
              <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--accent-primary-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-primary-light)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontWeight: 600 }}>COMPRESSIVE STRENGTH</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }} className="font-mono">{record.compressiveStrength} MPa</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Tested via IS 3495 Part 1</div>
              </div>

              <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--accent-secondary-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-secondary-light)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>WATER ABSORPTION</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }} className="font-mono">{record.waterAbsorption}%</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>24h Immersion (Limit: ≤20%)</div>
              </div>

              <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>CURING PROTOCOL</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }} className="font-mono">{record.curingDays} Days</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Method: {record.curingType}</div>
              </div>
            </div>
          </div>

          {/* Notes & Experimental Observations */}
          {record.notes && (
            <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-6)', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>Experimental Notes:</div>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{record.notes}</p>
            </div>
          )}

          {/* Footer Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close Inspector
            </Button>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};
