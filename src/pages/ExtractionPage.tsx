import React, { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { GlassPanel } from '../components/common/GlassPanel';
import { Button } from '../components/common/Button';
import { ProcessingStepper } from '../components/common/ProcessingStepper';
import type { StepItem } from '../components/common/ProcessingStepper';
import { Upload, FileText, CheckCircle2, RefreshCw } from 'lucide-react';

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
      doi: '10.1016/j.conbuildmat.2021.124501',
      tables: 4,
      pages: 12,
    },
    {
      id: 'paper-2',
      title: 'Mechanical and Durability Properties of High Volume Fly Ash Bricks with OPC Additives',
      authors: 'Shaikh et al. (2019)',
      doi: '10.1016/j.conbuildmat.2019.04.112',
      tables: 3,
      pages: 9,
    },
    {
      id: 'paper-3',
      title: 'Steam-Cured Fly Ash-Quarry Dust Bricks for High-Strength Masonry Units',
      authors: 'Turgut & Algin (2020)',
      doi: '10.1061/(ASCE)MT.1943-5533.0003011',
      tables: 5,
      pages: 14,
    },
  ];

  const extractionSteps: StepItem[] = [
    { id: 1, label: 'Reading PDF Document', description: 'Decompressing PDF vector streams and parsing text layers' },
    { id: 2, label: 'Detecting Experimental Tables', description: 'Identifying bounding boxes for mix design matrices' },
    { id: 3, label: 'Extracting Numerical Values', description: 'Converting OCR grid cells into chemical raw values' },
    { id: 4, label: 'Standardizing Constituent Fields', description: 'Harmonizing wt%, g/kg, and volume notations into dry mass %' },
    { id: 5, label: 'Enforcing Validation & IS Rules', description: 'Checking 100% mass balance and IS 12894 constraint conformity' },
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
    }, 700);
  };

  const currentPaper = samplePapers.find((p) => p.id === selectedPaper) || samplePapers[0];

  return (
    <AppShell
      title="01. Literature Data Extraction Engine"
      subtitle="Interactive simulation of document AI table detection, unit normalization, and stoichiometric validation."
      badge="Extraction Engine"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-8)',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Paper Selection & Upload Simulation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <GlassPanel padding="lg">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <FileText size={18} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Select Empirical Research Paper</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
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
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--accent-primary-subtle)' : 'var(--bg-surface-subtle)',
                      border: isSelected ? '1px solid var(--accent-primary-light)' : '1px solid var(--border-subtle)',
                      cursor: isExtracting ? 'not-allowed' : 'pointer',
                      transition: 'all 160ms ease',
                    }}
                  >
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                      {paper.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{paper.authors}</span>
                      <span className="font-mono">DOI: {paper.doi}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {currentPaper.tables} tables detected in document
              </span>
              <Button
                variant="primary"
                onClick={runExtractionSimulation}
                isLoading={isExtracting}
                disabled={isExtracting}
                icon={<RefreshCw size={16} />}
              >
                {isExtracting ? 'Running Extraction Pipeline...' : 'Simulate Table Extraction'}
              </Button>
            </div>
          </GlassPanel>

          {/* Stepper Display */}
          <GlassPanel padding="lg">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
              Extraction Pipeline Sequence
            </h3>
            <ProcessingStepper
              steps={extractionSteps}
              currentStepIndex={currentStepIndex}
              isComplete={isComplete}
            />
          </GlassPanel>
        </div>

        {/* Right Column: Real-time Extraction Results */}
        <div>
          <GlassPanel padding="lg" accentBorder style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <div>
                <span className="badge badge-emerald font-mono">EXTRACTION RESULTS</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '4px' }}>
                  Parsed Experimental Mix Matrix
                </h3>
              </div>
              <span className="badge badge-subtle font-mono" style={{ fontSize: '0.72rem' }}>
                {isComplete ? '100% Parsed' : isExtracting ? 'In Progress' : 'Ready'}
              </span>
            </div>

            {!isComplete && !isExtracting && (
              <div
                style={{
                  padding: 'var(--space-12) var(--space-6)',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: 'auto 0',
                }}
              >
                <Upload size={36} style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }} />
                <h4 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-1)' }}>Awaiting Extraction Execution</h4>
                <p style={{ fontSize: '0.85rem', maxWidth: '380px' }}>
                  Click &ldquo;Simulate Table Extraction&rdquo; on the left to trigger the automated OCR and stoichiometric normalization sequence.
                </p>
              </div>
            )}

            {isExtracting && (
              <div style={{ padding: 'var(--space-12) var(--space-6)', textAlign: 'center', margin: 'auto 0' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid var(--border-medium)', borderTopColor: 'var(--accent-primary)', animation: 'spin 1s linear infinite', margin: '0 auto var(--space-4)' }} />
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  {extractionSteps[currentStepIndex].label}...
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {extractionSteps[currentStepIndex].description}
                </div>
              </div>
            )}

            {isComplete && (
              <div>
                <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--status-success-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--status-success)', marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <CheckCircle2 size={20} color="var(--status-success)" />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Extraction & Standardization Complete
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      2 experimental mix rows validated • Confidence Score: 98.6%
                    </div>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', marginBottom: 'var(--space-6)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-surface-subtle)', borderBottom: '1px solid var(--border-medium)', textAlign: 'left' }}>
                        <th style={{ padding: '8px' }}>Mix ID</th>
                        <th style={{ padding: '8px' }}>FA %</th>
                        <th style={{ padding: '8px' }}>Lime %</th>
                        <th style={{ padding: '8px' }}>Gyp %</th>
                        <th style={{ padding: '8px' }}>W/B</th>
                        <th style={{ padding: '8px' }}>28D MPa</th>
                        <th style={{ padding: '8px' }}>Abs %</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '8px', color: 'var(--accent-primary)', fontWeight: 700 }}>FA-EXT-01</td>
                        <td style={{ padding: '8px' }}>65.0</td>
                        <td style={{ padding: '8px' }}>18.0</td>
                        <td style={{ padding: '8px' }}>5.0</td>
                        <td style={{ padding: '8px' }}>0.14</td>
                        <td style={{ padding: '8px', fontWeight: 700 }}>16.4</td>
                        <td style={{ padding: '8px' }}>11.2</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px', color: 'var(--accent-primary)', fontWeight: 700 }}>FA-EXT-02</td>
                        <td style={{ padding: '8px' }}>60.0</td>
                        <td style={{ padding: '8px' }}>15.0</td>
                        <td style={{ padding: '8px' }}>5.0</td>
                        <td style={{ padding: '8px' }}>0.15</td>
                        <td style={{ padding: '8px', fontWeight: 700 }}>19.2</td>
                        <td style={{ padding: '8px' }}>10.4</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                  <strong>Next Step:</strong> Records are queued for ingestion into the standardized benchmark dataset.
                </div>
              </div>
            )}
          </GlassPanel>
        </div>
      </div>
    </AppShell>
  );
};
