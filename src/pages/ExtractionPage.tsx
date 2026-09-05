import React, { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/common/Button';
import { ProcessingStepper } from '../components/common/ProcessingStepper';
import type { StepItem } from '../components/common/ProcessingStepper';
import { CheckCircle2, RefreshCw, Layers, Database } from 'lucide-react';

export const ExtractionPage: React.FC = () => {
  const [selectedPaper, setSelectedPaper] = useState<string>('paper-1');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  const samplePapers = [
    {
      id: 'paper-1',
      title: 'Experimental Investigation on Pozzolanic Reactivity of Class F Fly Ash-Lime-Gypsum Bricks',
      authors: 'Kumar & Prasad (2021)',
      journal: 'Construction and Building Materials',
      doi: '10.1016/j.conbuildmat.2021.124501',
      tables: 4,
      pages: 12,
      rawNotation: 'Mass ratio (g/batch)',
      targetTable: 'Table 4: Mix proportions and 28-day mechanical properties',
      boundingBox: { x: 44, y: 180, w: 480, h: 160 },
    },
    {
      id: 'paper-2',
      title: 'Mechanical and Durability Properties of High Volume Fly Ash Bricks with OPC Additives',
      authors: 'Shaikh et al. (2019)',
      journal: 'Materials and Structures (RILEM)',
      doi: '10.1016/j.conbuildmat.2019.04.112',
      tables: 3,
      pages: 9,
      rawNotation: 'Dry wt% fraction',
      targetTable: 'Table 2: Chemical analysis and compressive resistance',
      boundingBox: { x: 44, y: 220, w: 480, h: 140 },
    },
    {
      id: 'paper-3',
      title: 'Steam-Cured Fly Ash-Quarry Dust Bricks for High-Strength Masonry Units',
      authors: 'Turgut & Algin (2020)',
      journal: 'ASCE Journal of Materials in Civil Engineering',
      doi: '10.1061/(ASCE)MT.1943-5533.0003011',
      tables: 5,
      pages: 14,
      rawNotation: 'kg/m³ batch mass',
      targetTable: 'Table 3: Specimen composition and absorption limits',
      boundingBox: { x: 44, y: 150, w: 480, h: 170 },
    },
  ];

  const extractionSteps: StepItem[] = [
    { id: 1, label: 'Reading PDF Vector Streams', description: 'Decompressing document xref table and parsing spatial glyph positions' },
    { id: 2, label: 'Detecting Experimental Tables', description: 'Locating ruling lines and cell coordinates for mix design matrices' },
    { id: 3, label: 'Extracting Numerical Cells', description: 'OCR token extraction of FA %, Lime, Gypsum, and curing age' },
    { id: 4, label: 'Standardizing Constituent Units', description: 'Converting g/kg and volume fractions to dry solid mass percentage' },
    { id: 5, label: 'Stoichiometric Validation', description: 'Enforcing 100% mass balance and checking against IS 12894 constraints' },
  ];

  const runExtractionSimulation = () => {
    setIsExtracting(true);
    setIsComplete(false);
    setCurrentStepIndex(0);

    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < extractionSteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          setIsExtracting(false);
          setIsComplete(true);
          return prev;
        }
      });
    }, 650);
  };

  const currentPaper = samplePapers.find((p) => p.id === selectedPaper) || samplePapers[0];

  return (
    <AppShell
      title="01. Literature Data Extraction Engine"
      subtitle="Document-centric extraction simulating PDF table localization, token normalization, and stoichiometric validation."
      badge="Literature Extraction"
      badgeVariant="teal"
    >
      {/* Document-Centric Asymmetric Workspace */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 380px) 1fr',
          gap: 'var(--space-6)',
          alignItems: 'start',
        }}
        className="extraction-grid"
      >
        {/* LEFT COLUMN: Research Document Browser & Pipeline Control */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Document Ingestion Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <span className="editorial-eyebrow" style={{ fontSize: '0.68rem' }}>DOCUMENT CORPUS</span>
              <span className="badge badge-subtle font-mono" style={{ fontSize: '0.68rem' }}>3 Ingested</span>
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
              Select Empirical Paper
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              {samplePapers.map((paper) => {
                const isSelected = selectedPaper === paper.id;
                return (
                  <div
                    key={paper.id}
                    onClick={() => {
                      if (!isExtracting) {
                        setSelectedPaper(paper.id);
                        setIsComplete(false);
                        setCurrentStepIndex(0);
                      }
                    }}
                    style={{
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'var(--accent-primary-subtle)' : 'var(--bg-surface-subtle)',
                      border: isSelected ? '1px solid var(--accent-primary-light)' : '1px solid var(--border-hairline)',
                      cursor: isExtracting ? 'not-allowed' : 'pointer',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: '3px' }}>
                      {paper.title}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                      {paper.authors} • <em>{paper.journal}</em>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                      <span>{paper.doi}</span>
                      <span>{paper.tables} Tables</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Extraction Trigger Button */}
            <Button
              variant="primary"
              onClick={runExtractionSimulation}
              isLoading={isExtracting}
              disabled={isExtracting}
              icon={<RefreshCw size={15} />}
              style={{ width: '100%' }}
            >
              {isExtracting ? 'Extracting Mix Table...' : 'Simulate Table Extraction'}
            </Button>
          </div>

          {/* Stepper Pipeline Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <span className="editorial-eyebrow" style={{ fontSize: '0.68rem' }}>ETL PIPELINE SEQUENCE</span>
              <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                Stage {currentStepIndex + 1}/5
              </span>
            </div>
            <ProcessingStepper
              steps={extractionSteps}
              currentStepIndex={currentStepIndex}
              isComplete={isComplete}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Document Viewport & Extracted Structured Records */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Simulated PDF Layout Inspection Viewport */}
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
                <span className="editorial-eyebrow" style={{ fontSize: '0.68rem' }}>DOCUMENT OCR VIEWPORT</span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {currentPaper.targetTable}
                </h4>
              </div>
              <span className="badge badge-subtle font-mono" style={{ fontSize: '0.7rem' }}>
                Raw: {currentPaper.rawNotation}
              </span>
            </div>

            {/* Simulated Paper Document Sheet */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                position: 'relative',
                minHeight: '180px',
                fontFamily: 'serif',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
              }}
            >
              {/* Paper excerpt mockup */}
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                3. Materials and Mix Design Formulation
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', fontStyle: 'italic' }}>
                Class F fly ash conformed to IS 3812 Part 1 guidelines. Laboratory trial batches were cured for 7, 14, and 28 days under ambient water submersion...
              </p>

              {/* Bounding box highlighter over table area */}
              <div
                style={{
                  border: isExtracting || isComplete ? '2px solid var(--accent-primary)' : '1px dashed var(--border-medium)',
                  backgroundColor: isExtracting || isComplete ? 'var(--accent-primary-subtle)' : 'transparent',
                  borderRadius: 'var(--radius-xs)',
                  padding: 'var(--space-3)',
                  position: 'relative',
                  transition: 'all 240ms ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
                    [OCR BOUNDING BOX DETECTED: {currentPaper.boundingBox.w} × {currentPaper.boundingBox.h} px]
                  </span>
                  <span className="badge badge-subtle font-mono" style={{ fontSize: '0.65rem' }}>
                    Conf: 98.6%
                  </span>
                </div>

                {/* Raw un-normalized table mockup inside document */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-tertiary)' }}>
                      <th style={{ padding: '4px' }}>Batch Code</th>
                      <th style={{ padding: '4px' }}>Fly Ash (g)</th>
                      <th style={{ padding: '4px' }}>Lime (g)</th>
                      <th style={{ padding: '4px' }}>Gypsum (g)</th>
                      <th style={{ padding: '4px' }}>W/B</th>
                      <th style={{ padding: '4px' }}>28D Comp (MPa)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border-hairline)' }}>
                      <td style={{ padding: '4px', fontWeight: 600 }}>M1-65</td>
                      <td style={{ padding: '4px' }}>650</td>
                      <td style={{ padding: '4px' }}>180</td>
                      <td style={{ padding: '4px' }}>50</td>
                      <td style={{ padding: '4px' }}>0.14</td>
                      <td style={{ padding: '4px', fontWeight: 700, color: 'var(--accent-primary)' }}>16.4</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px', fontWeight: 600 }}>M2-60</td>
                      <td style={{ padding: '4px' }}>600</td>
                      <td style={{ padding: '4px' }}>150</td>
                      <td style={{ padding: '4px' }}>50</td>
                      <td style={{ padding: '4px' }}>0.15</td>
                      <td style={{ padding: '4px', fontWeight: 700, color: 'var(--accent-primary)' }}>19.2</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Standardized Extracted Table Surface */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <div>
                <span className="editorial-eyebrow" style={{ fontSize: '0.68rem' }}>CANONICAL SCHEMA OUTPUT</span>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Standardized Benchmark Ingestion Table
                </h4>
              </div>
              <span className={`badge ${isComplete ? 'badge-emerald' : 'badge-subtle'} font-mono`} style={{ fontSize: '0.72rem' }}>
                {isComplete ? '2 Records Validated' : isExtracting ? 'Normalizing...' : 'Awaiting Trigger'}
              </span>
            </div>

            {!isComplete && !isExtracting && (
              <div
                style={{
                  padding: 'var(--space-8) var(--space-4)',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Layers size={32} style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }} />
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Ready for Table Extraction Simulation</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', maxWidth: '360px', marginTop: '2px' }}>
                  Click &ldquo;Simulate Table Extraction&rdquo; to execute the multi-step heuristic OCR and dry mass balance conversion.
                </p>
              </div>
            )}

            {isExtracting && (
              <div style={{ padding: 'var(--space-8) var(--space-4)', textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border-medium)', borderTopColor: 'var(--accent-primary)', animation: 'spin 0.9s linear infinite', margin: '0 auto var(--space-3)' }} />
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                  {extractionSteps[currentStepIndex].label}...
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  {extractionSteps[currentStepIndex].description}
                </div>
              </div>
            )}

            {isComplete && (
              <div>
                <div
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    backgroundColor: 'var(--status-success-bg)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--status-success)',
                    marginBottom: 'var(--space-4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                  }}
                >
                  <CheckCircle2 size={18} color="var(--status-success)" />
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Stoichiometric Normalization Complete (Σ Mass = 100.0%)
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      IS 12894 constraint verification: All records passed range sanity checks.
                    </div>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', marginBottom: 'var(--space-4)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', fontFamily: 'var(--font-mono)', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-medium)' }}>
                      <tr style={{ color: 'var(--text-tertiary)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '8px 12px' }}>Mix ID</th>
                        <th style={{ padding: '8px' }}>FA %</th>
                        <th style={{ padding: '8px' }}>Lime %</th>
                        <th style={{ padding: '8px' }}>Gyp %</th>
                        <th style={{ padding: '8px' }}>Sand %</th>
                        <th style={{ padding: '8px' }}>W/B</th>
                        <th style={{ padding: '8px' }}>28D (MPa)</th>
                        <th style={{ padding: '8px' }}>Abs %</th>
                        <th style={{ padding: '8px 12px' }}>IS Class</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--border-hairline)' }} className="dataset-row">
                        <td style={{ padding: '8px 12px', color: 'var(--accent-primary)', fontWeight: 700 }}>FA-EXT-01</td>
                        <td style={{ padding: '8px' }}>65.0</td>
                        <td style={{ padding: '8px' }}>18.0</td>
                        <td style={{ padding: '8px' }}>5.0</td>
                        <td style={{ padding: '8px' }}>12.0</td>
                        <td style={{ padding: '8px' }}>0.14</td>
                        <td style={{ padding: '8px', fontWeight: 700, color: 'var(--accent-primary)' }}>16.4</td>
                        <td style={{ padding: '8px' }}>11.2</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span className="badge badge-emerald font-mono" style={{ fontSize: '0.65rem' }}>Class 15</span>
                        </td>
                      </tr>
                      <tr className="dataset-row">
                        <td style={{ padding: '8px 12px', color: 'var(--accent-primary)', fontWeight: 700 }}>FA-EXT-02</td>
                        <td style={{ padding: '8px' }}>60.0</td>
                        <td style={{ padding: '8px' }}>15.0</td>
                        <td style={{ padding: '8px' }}>5.0</td>
                        <td style={{ padding: '8px' }}>20.0</td>
                        <td style={{ padding: '8px' }}>0.15</td>
                        <td style={{ padding: '8px', fontWeight: 700, color: 'var(--accent-primary)' }}>19.2</td>
                        <td style={{ padding: '8px' }}>10.4</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span className="badge badge-emerald font-mono" style={{ fontSize: '0.65rem' }}>Class 17.5</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
                  <Database size={13} />
                  <span>
                    Records are staged for insertion into the central fly ash benchmark dataset schema.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .extraction-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </AppShell>
  );
};
