import React, { useState } from 'react';

interface StoryStep {
  step: number;
  label: string;
  milestone: string;
  description: string;
  codeSnippet?: string;
  visualState: React.ReactNode;
}

export const ScrollPipelineStory: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps: StoryStep[] = [
    {
      step: 1,
      label: '01 / FRAGMENTATION',
      milestone: 'Research literature is fragmented across hundreds of disparate papers',
      description: 'Civil and materials engineering researchers publish fly ash brick tests with conflicting chemical reporting units (mass ratios, wt%, dry bag weight) and unstandardized curing durations.',
      visualState: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-mineral)' }}>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Kumar &amp; Prasad (2021) • Table 3</div>
            <div style={{ fontSize: '0.88rem', fontFamily: 'var(--font-mono)', marginTop: '2px', color: 'var(--text-primary)' }}>
              FA = 65 wt%, Ca(OH)₂ = 18%, CaSO₄·2H₂O = 5%, W/B = 0.14
            </div>
          </div>
          <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-secondary)' }}>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Shaikh &amp; Supit (2019) • Table 2</div>
            <div style={{ fontSize: '0.88rem', fontFamily: 'var(--font-mono)', marginTop: '2px', color: 'var(--text-primary)' }}>
              FlyAsh = 700 g/kg, OPC = 100 g/kg, Lime = 80 g/kg, Gyp = 40 g/kg
            </div>
          </div>
        </div>
      ),
    },
    {
      step: 2,
      label: '02 / EXTRACTION',
      milestone: 'Document AI extracts experimental information from PDF tables',
      description: 'Bounding-box heuristics identify tabular experimental matrices within academic PDFs, isolating constituent proportions and reported mechanical test outcomes.',
      visualState: (
        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)' }}>
            <span>Bounding Box [x:120, y:340, w:420, h:180]</span>
            <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>98.4% Confidence</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-secondary)' }}>
            <div>&bull; Extracted column: [Fly Ash Class F] &rarr; parsed</div>
            <div>&bull; Extracted column: [Hydrated Lime CaO] &rarr; parsed</div>
            <div>&bull; Extracted column: [28D Compressive Strength] &rarr; parsed</div>
          </div>
        </div>
      ),
    },
    {
      step: 3,
      label: '03 / STANDARDIZATION',
      milestone: 'Data is standardized into a unified benchmark dataset',
      description: 'Varied measurement scales are harmonized into percentage totals equaling 100% dry solid mass. Missing parameters are imputed and validated against IS 12894:2002.',
      visualState: (
        <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-surface-subtle)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
          <table style={{ width: '100%', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: 'var(--text-tertiary)', textAlign: 'left', borderBottom: '1px solid var(--border-medium)' }}>
                <th style={{ padding: '4px' }}>Mix UID</th>
                <th style={{ padding: '4px' }}>FA %</th>
                <th style={{ padding: '4px' }}>Lime %</th>
                <th style={{ padding: '4px' }}>Gyp %</th>
                <th style={{ padding: '4px' }}>Sum</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '4px', color: 'var(--accent-primary)', fontWeight: 700 }}>FA-STD-01</td>
                <td style={{ padding: '4px' }}>65.0%</td>
                <td style={{ padding: '4px' }}>18.0%</td>
                <td style={{ padding: '4px' }}>5.0%</td>
                <td style={{ padding: '4px', color: 'var(--status-success)', fontWeight: 700 }}>100.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    },
    {
      step: 4,
      label: '04 / FEATURE SPACE',
      milestone: 'Models learn from the curated benchmark dataset',
      description: 'Stoichiometric feature spaces encode the activation kinetics between reactive silica/alumina in fly ash, calcium hydroxide, and sulfate hydration.',
      visualState: (
        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
          <div style={{ color: 'var(--accent-primary)', fontWeight: 700, marginBottom: '4px' }}>
            Feature Vector X &isin; &real;ᵈ:
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            [x_FA, x_Lime, x_Gypsum, x_OPC, x_Agg, W/B, CuringDays, Density]
          </div>
        </div>
      ),
    },
    {
      step: 5,
      label: '05 / QUALITY PREDICTION',
      milestone: 'Quality is predicted in real time via surrogate models',
      description: 'Multi-output ensemble regressors map constituent ratios directly into 28-day Compressive Strength (MPa) and 24-hour Water Absorption (%).',
      visualState: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--accent-primary-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontWeight: 700 }}>PREDICTED STRENGTH</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>17.2 MPa</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>IS 12894: Class 15</div>
          </div>
          <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--accent-secondary-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-secondary)', fontWeight: 700 }}>WATER ABSORPTION</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>11.2%</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--status-success)' }}>Pass (&le; 20% limit)</div>
          </div>
        </div>
      ),
    },
    {
      step: 6,
      label: '06 / OPTIMIZATION',
      milestone: 'Optimization searches feasible manufacturing settings',
      description: 'Multi-objective Pareto frontier algorithms evaluate candidate mix formulations to maximize fly ash utilization while minimizing clinker consumption.',
      visualState: (
        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Candidate Formulations Evaluated:</span>
            <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>1,420 vectors</span>
          </div>
          <div style={{ height: '6px', backgroundColor: 'var(--border-medium)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--accent-primary)' }} />
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            Pareto Convergence: Optimal trade-off reached at 65% Fly Ash
          </div>
        </div>
      ),
    },
    {
      step: 7,
      label: '07 / INDUSTRIAL DECISION',
      milestone: 'An interpretable, compliant manufacturing batch recipe is generated',
      description: 'Actionable batch sheet for pan mixers, hydraulic press compaction pressure guidelines (20 MPa), and steam/ambient water-curing regimens conforming to IS 12894.',
      visualState: (
        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--status-success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Plant Batch Prescription (500 Bricks)</span>
            <span className="badge badge-emerald font-mono" style={{ fontSize: '0.68rem' }}>IS 12894: Class 15</span>
          </div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            Fly Ash: 767 kg &bull; Lime: 212 kg &bull; Gypsum: 59 kg &bull; Water: 165 L
          </div>
        </div>
      ),
    },
  ];

  const current = steps.find((s) => s.step === activeStep) || steps[0];

  return (
    <section id="pipeline-story-section" className="section" style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-hairline)' }}>
      <div className="container">
        {/* Editorial Section Header */}
        <div style={{ marginBottom: 'var(--space-10)' }}>
          <div className="editorial-eyebrow" style={{ marginBottom: 'var(--space-2)' }}>
            Data Storytelling &bull; From Literature to Factory Batching
          </div>
          <h2 style={{ fontSize: 'clamp(1.85rem, 3vw + 0.5rem, 2.6rem)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            How the Framework Operates
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '640px', marginTop: 'var(--space-2)' }}>
            A continuous computational sequence bridging fragmented empirical papers with verified manufacturing decisions.
          </p>
        </div>

        {/* Narrative Flow: Left Timeline Rail + Right Morphing Viewport */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-10)',
            alignItems: 'start',
          }}
          className="story-grid"
        >
          {/* Left Milestone Stepping Rail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {steps.map((st) => {
              const isActive = activeStep === st.step;
              return (
                <div
                  key={st.step}
                  onClick={() => setActiveStep(st.step)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveStep(st.step); }}
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 160ms ease',
                    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                  }}
                  className="story-timeline-item"
                >
                  <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                    {st.label}
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.35 }}>
                    {st.milestone}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Morphing Viewport */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-medium)',
              padding: 'var(--space-8)',
              boxShadow: 'var(--shadow-md)',
              position: 'sticky',
              top: '100px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <span className="editorial-eyebrow">{current.label} TRANSFORMATION</span>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                Step {current.step} of 7
              </span>
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
              {current.milestone}
            </h3>

            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 'var(--space-6)' }}>
              {current.description}
            </p>

            <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: 'var(--space-5)' }}>
              <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.06em', marginBottom: 'var(--space-2)' }}>
                Active Computational State:
              </div>
              {current.visualState}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .story-timeline-item:hover {
          background-color: var(--bg-surface-subtle) !important;
        }
        @media (min-width: 1024px) {
          .story-grid {
            grid-template-columns: 1.15fr 1fr !important;
          }
        }
      `}</style>
    </section>
  );
};
