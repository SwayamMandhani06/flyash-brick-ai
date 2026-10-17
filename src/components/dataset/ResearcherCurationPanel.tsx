import React, { useState, useEffect, useRef } from 'react';
import { curationService } from '../../lib/api/services';
import type { LiveReadinessOverviewResponse, CSVImportResponse, CSVImportRowResult } from '../../lib/api/types';
import { Button } from '../common/Button';
import {
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  RefreshCw,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const ResearcherCurationPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [readiness, setReadiness] = useState<LiveReadinessOverviewResponse | null>(null);
  const [isLoadingReadiness, setIsLoadingReadiness] = useState<boolean>(true);
  const [readinessError, setReadinessError] = useState<string | null>(null);

  // CSV Import State
  const [file, setFile] = useState<File | null>(null);
  const [curatorName, setCuratorName] = useState<string>('');
  const [paperId, setPaperId] = useState<string>('');
  const [sourcePage, setSourcePage] = useState<string>('');
  const [sourceTable, setSourceTable] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<CSVImportResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadReadinessData = async () => {
    try {
      const data = await curationService.getLiveReadinessOverview();
      setReadiness(data);
      setReadinessError(null);
    } catch (err: any) {
      setReadinessError(err.message || 'Unable to load live dataset readiness report.');
    } finally {
      setIsLoadingReadiness(false);
    }
  };

  const handleManualRefresh = () => {
    setIsLoadingReadiness(true);
    setReadinessError(null);
    void loadReadinessData();
  };

  useEffect(() => {
    let isCancelled = false;
    curationService
      .getLiveReadinessOverview()
      .then((data) => {
        if (!isCancelled) {
          setReadiness(data);
          setReadinessError(null);
        }
      })
      .catch((err: any) => {
        if (!isCancelled) {
          setReadinessError(err.message || 'Unable to load live dataset readiness report.');
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingReadiness(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleDownloadTemplate = async () => {
    try {
      const text = await curationService.downloadCSVTemplate();
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'flyash_curation_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Error downloading CSV template: ${err.message}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadError(null);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please select a valid CSV file to ingest.');
      return;
    }
    if (!curatorName.trim()) {
      setUploadError('Curator name is mandatory for research provenance attribution.');
      return;
    }
    if (!paperId.trim()) {
      setUploadError('Paper ID is required to link records to a registered peer-reviewed paper.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setImportResult(null);

    try {
      const res = await curationService.importCuratedCSV(
        file,
        curatorName.trim(),
        paperId.trim(),
        sourcePage.trim() || undefined,
        sourceTable.trim() || undefined
      );
      setImportResult(res);
      // Refresh readiness overview after successful import
      void loadReadinessData();
    } catch (err: any) {
      setUploadError(err.message || 'CSV ingestion failed. Please verify headers and format.');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready_for_evaluation':
        return <span className="badge badge-emerald">Ready for Evaluation</span>;
      case 'preliminary_limited_evidence':
        return <span className="badge badge-subtle">Preliminary Limited Evidence</span>;
      case 'unsupported_insufficient_data':
      default:
        return <span className="badge badge-rose">Unsupported: Insufficient Data</span>;
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        marginBottom: 'var(--space-6)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Workstation Header */}
      <div
        style={{
          padding: 'var(--space-4) var(--space-5)',
          backgroundColor: 'var(--bg-surface-elevated)',
          borderBottom: isExpanded ? '1px solid var(--border-subtle)' : 'none',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-primary-subtle)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileSpreadsheet size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                Researcher Data Curation & Live Target Readiness
              </h3>
              <span className="badge badge-subtle font-mono" style={{ fontSize: '0.66rem' }}>
                Phase 10 Hardened
              </span>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
              Upload structured literature experimental data, review provenance, and track fail-closed readiness criteria.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Button
            variant="outline"
            size="sm"
            icon={<Download size={13} />}
            onClick={(e) => {
              e.stopPropagation();
              void handleDownloadTemplate();
            }}
          >
            Download CSV Template
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={13} className={isLoadingReadiness ? 'animate-spin' : ''} />}
            onClick={(e) => {
              e.stopPropagation();
              handleManualRefresh();
            }}
            title="Refresh Live Target Readiness"
          >
            Refresh
          </Button>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: 'var(--space-5)' }}>
          {/* Target Readiness Status Cards */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Fail-Closed Empirical Modeling Gates
              </h4>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Rule: Training and inference locked until &ge;15 accepted empirical records across &ge;3 independent peer-reviewed papers.
              </span>
            </div>

            {readinessError && (
              <div
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: 'var(--state-error-subtle)',
                  border: '1px solid var(--state-error-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--state-error-text)',
                  fontSize: '0.82rem',
                  marginBottom: 'var(--space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                <AlertTriangle size={16} />
                <span>{readinessError}</span>
              </div>
            )}

            {readiness && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                  gap: 'var(--space-4)',
                }}
              >
                {/* Compressive Strength Target Card */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-4)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                        Compressive Strength (28-day)
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        Target: {readiness.compressive_strength.target_property}
                      </div>
                    </div>
                    {getStatusBadge(readiness.compressive_strength.readiness_status)}
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-2)',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: 'var(--space-3)',
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Eligible Samples</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-primary)' }} className="font-mono">
                        {readiness.compressive_strength.eligible_sample_count} / 15
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Peer Papers</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-secondary)' }} className="font-mono">
                        {readiness.compressive_strength.distinct_paper_count} / 3
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Missing Target</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }} className="font-mono">
                        {readiness.compressive_strength.missing_target_count}
                      </div>
                    </div>
                  </div>

                  {readiness.compressive_strength.unmet_readiness_criteria.length > 0 && (
                    <div style={{ marginBottom: 'var(--space-3)' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--state-error-text)', marginBottom: '4px' }}>
                        Unmet Readiness Criteria:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        {readiness.compressive_strength.unmet_readiness_criteria.map((crit, idx) => (
                          <li key={idx} style={{ marginBottom: '2px' }}>{crit}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div
                    style={{
                      padding: 'var(--space-2) var(--space-3)',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '0.74rem',
                      color: 'var(--text-muted)',
                      borderLeft: '3px solid var(--accent-primary)',
                    }}
                  >
                    <strong>Action:</strong> {readiness.compressive_strength.next_corrective_action}
                  </div>
                </div>

                {/* Water Absorption Target Card */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-4)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                        Water Absorption (28-day)
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        Target: {readiness.water_absorption.target_property}
                      </div>
                    </div>
                    {getStatusBadge(readiness.water_absorption.readiness_status)}
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-2)',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: 'var(--space-3)',
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Eligible Samples</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-primary)' }} className="font-mono">
                        {readiness.water_absorption.eligible_sample_count} / 15
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Peer Papers</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-secondary)' }} className="font-mono">
                        {readiness.water_absorption.distinct_paper_count} / 3
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Missing Target</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }} className="font-mono">
                        {readiness.water_absorption.missing_target_count}
                      </div>
                    </div>
                  </div>

                  {readiness.water_absorption.unmet_readiness_criteria.length > 0 && (
                    <div style={{ marginBottom: 'var(--space-3)' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--state-error-text)', marginBottom: '4px' }}>
                        Unmet Readiness Criteria:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        {readiness.water_absorption.unmet_readiness_criteria.map((crit, idx) => (
                          <li key={idx} style={{ marginBottom: '2px' }}>{crit}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div
                    style={{
                      padding: 'var(--space-2) var(--space-3)',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '0.74rem',
                      color: 'var(--text-muted)',
                      borderLeft: '3px solid var(--accent-secondary)',
                    }}
                  >
                    <strong>Action:</strong> {readiness.water_absorption.next_corrective_action}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ingestion Form & Protocol */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <Upload size={16} style={{ color: 'var(--accent-primary)' }} />
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0 }}>
                Curate & Ingest Literature Mixes via CSV
              </h4>
            </div>

            <div
              style={{
                padding: 'var(--space-2) var(--space-3)',
                backgroundColor: 'rgba(234, 179, 8, 0.08)',
                border: '1px solid rgba(234, 179, 8, 0.25)',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-4)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-2)',
              }}
            >
              <ShieldAlert size={16} style={{ color: '#eab308', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Scientific Safeguard Policy:</strong> All imported mixes enter the database in{' '}
                <span className="badge badge-subtle font-mono" style={{ fontSize: '0.65rem' }}>needs_review</span>{' '}
                state. No rows are auto-accepted. Empty cells remain unrecorded (never zero-filled) to preserve scientific validity.
              </div>
            </div>

            <form onSubmit={handleImportSubmit}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 'var(--space-3)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    CSV Data File *
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    style={{
                      width: '100%',
                      padding: '0.35rem 0.6rem',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: 'var(--bg-surface)',
                      fontSize: '0.78rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Curator Name / Attribution *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Dr. S. Sharma"
                    value={curatorName}
                    onChange={(e) => setCuratorName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.42rem 0.6rem',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: 'var(--bg-surface)',
                      fontSize: '0.78rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Registered Paper ID *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., paper-1"
                    value={paperId}
                    onChange={(e) => setPaperId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.42rem 0.6rem',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: 'var(--bg-surface)',
                      fontSize: '0.78rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Source Table & Page (Provenance)
                  </label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <input
                      type="text"
                      placeholder="Page (e.g., 6)"
                      value={sourcePage}
                      onChange={(e) => setSourcePage(e.target.value)}
                      style={{
                        width: '50%',
                        padding: '0.42rem 0.6rem',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border-medium)',
                        backgroundColor: 'var(--bg-surface)',
                        fontSize: '0.78rem',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Table (e.g., Table 4)"
                      value={sourceTable}
                      onChange={(e) => setSourceTable(e.target.value)}
                      style={{
                        width: '50%',
                        padding: '0.42rem 0.6rem',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border-medium)',
                        backgroundColor: 'var(--bg-surface)',
                        fontSize: '0.78rem',
                      }}
                    />
                  </div>
                </div>
              </div>

              {uploadError && (
                <div
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    backgroundColor: 'var(--state-error-subtle)',
                    border: '1px solid var(--state-error-border)',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--state-error-text)',
                    fontSize: '0.78rem',
                    marginBottom: 'var(--space-3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                  }}
                >
                  <XCircle size={15} />
                  <span>{uploadError}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isUploading}
                  icon={isUploading ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />}
                >
                  {isUploading ? 'Ingesting & Validating...' : 'Ingest Curated Literature Batch'}
                </Button>
              </div>
            </form>

            {/* Ingestion Results Breakdown */}
            {importResult && (
              <div
                style={{
                  marginTop: 'var(--space-4)',
                  padding: 'var(--space-4)',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>
                      Batch Curation Summary for {importResult.filename}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
                    Curator: <strong>{importResult.curator_name}</strong>
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 'var(--space-2)',
                    textAlign: 'center',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  <div style={{ padding: 'var(--space-2)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-xs)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Total Rows</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{importResult.total_rows_processed}</div>
                  </div>
                  <div style={{ padding: 'var(--space-2)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-xs)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Needs Review</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                      {importResult.imported_records_count}
                    </div>
                  </div>
                  <div style={{ padding: 'var(--space-2)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-xs)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>With Warnings</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#eab308' }}>
                      {importResult.rows_with_warnings_count}
                    </div>
                  </div>
                  <div style={{ padding: 'var(--space-2)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-xs)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Rejected / Errors</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--state-error-text)' }}>
                      {importResult.rows_failed_count}
                    </div>
                  </div>
                </div>

                {/* Diagnostics List */}
                <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-xs)' }}>
                  <table style={{ width: '100%', fontSize: '0.74rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-hairline)' }}>
                      <tr style={{ color: 'var(--text-tertiary)' }}>
                        <th style={{ padding: '6px 10px' }}>Row</th>
                        <th style={{ padding: '6px 10px' }}>Record ID</th>
                        <th style={{ padding: '6px 10px' }}>Status</th>
                        <th style={{ padding: '6px 10px' }}>Diagnostics & Provenance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.row_results.map((r: CSVImportRowResult, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-hairline)' }}>
                          <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)' }}>{r.row_number}</td>
                          <td style={{ padding: '6px 10px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                            {r.record_id ? r.record_id.slice(0, 8) : '—'}
                          </td>
                          <td style={{ padding: '6px 10px' }}>
                            {r.status === 'created' && (
                              <span className="badge badge-subtle font-mono" style={{ fontSize: '0.62rem' }}>
                                needs_review
                              </span>
                            )}
                            {r.status === 'warning' && (
                              <span className="badge badge-rose font-mono" style={{ fontSize: '0.62rem' }}>
                                {r.duplicate_suspect ? 'dup_suspect' : 'warning'}
                              </span>
                            )}
                            {r.status === 'error' && (
                              <span className="badge badge-rose font-mono" style={{ fontSize: '0.62rem' }}>
                                rejected
                              </span>
                            )}
                            {r.status === 'skipped' && (
                              <span className="badge badge-subtle font-mono" style={{ fontSize: '0.62rem' }}>
                                skipped
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>
                            {r.errors && r.errors.length > 0 ? (
                              <span style={{ color: 'var(--state-error-text)' }}>{r.errors.join('; ')}</span>
                            ) : (
                              <div>
                                {r.warnings && r.warnings.length > 0 ? r.warnings.join('; ') : 'Parsed successfully.'}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
