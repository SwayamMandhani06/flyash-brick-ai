import React, { useState } from 'react';
import { SectionHeading } from '../common/SectionHeading';
import { GlassPanel } from '../common/GlassPanel';
import { FileText, Database, Cpu, Sliders, CheckCircle2 } from 'lucide-react';

export const ScrollPipelineStory: React.FC = () => {
  const [selectedStoryStage, setSelectedStoryStage] = useState<number>(1);

  const storyStages = [
    {
      step: 1,
      badge: 'STAGE 01',
      title: 'From Fragmented Literature',
      subtitle: 'Scattered academic papers with heterogeneous formats and inconsistent reporting units',
      icon: <FileText size={22} />,
      content: {
        heading: 'Raw Paper Ingestion & Document Decomposition',
        description: 'Empirical research on fly ash bricks is spread across hundreds of materials science journals (Elsevier, Springer, ASCE). Testing methodologies, water-to-binder notations, and curing terminology vary widely.',
        visual: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
            <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-mineral)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Kumar et al. (2021) Table 3:</span>
              <div style={{ color: 'var(--text-primary)', marginTop: '4px' }}>FA=65 wt%, Ca(OH)2=18%, CaSO4·2H2O=5%, W/B=0.14</div>
            </div>
            <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-secondary)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Shaikh & Supit (2019) Table 2:</span>
              <div style={{ color: 'var(--text-primary)', marginTop: '4px' }}>FlyAsh=700 g/kg, OPC-43=100 g/kg, Lime=80 g/kg, Gypsum=40 g/kg</div>
            </div>
          </div>
        ),
        benefit: 'Extracts tabular experimental matrices from PDF papers without manual re-typing.'
      }
    },
    {
      step: 2,
      badge: 'STAGE 02',
      title: 'To Structured Intelligence',
      subtitle: 'Constituent stoichiometry mapping into a unified, validated benchmark dataset',
      icon: <Database size={22} />,
      content: {
        heading: 'Standardized Feature Space & Stoichiometric Checks',
        description: 'Varied measurement scales (wt%, g/kg, mass ratios) are harmonized into strict percentage totals equaling 100%. Chemical mass balance is enforced, identifying outliers and validating against IS 3812:2013 and IS 12894:2002.',
        visual: (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-tertiary)', textAlign: 'left' }}>
                  <th style={{ padding: '4px 8px' }}>Mix UID</th>
                  <th style={{ padding: '4px 8px' }}>FA %</th>
                  <th style={{ padding: '4px 8px' }}>Lime %</th>
                  <th style={{ padding: '4px 8px' }}>Gyp %</th>
                  <th style={{ padding: '4px 8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '6px 8px', color: 'var(--accent-primary)', fontWeight: 600 }}>FA-STD-01</td>
                  <td style={{ padding: '6px 8px' }}>65.0</td>
                  <td style={{ padding: '6px 8px' }}>18.0</td>
                  <td style={{ padding: '6px 8px' }}>5.0</td>
                  <td style={{ padding: '6px 8px' }}><span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>VALIDATED</span></td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 8px', color: 'var(--accent-primary)', fontWeight: 600 }}>FA-STD-02</td>
                  <td style={{ padding: '6px 8px' }}>60.0</td>
                  <td style={{ padding: '6px 8px' }}>15.0</td>
                  <td style={{ padding: '6px 8px' }}>5.0</td>
                  <td style={{ padding: '6px 8px' }}><span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>VALIDATED</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        ),
        benefit: 'Creates an open, reproducible benchmark corpus ready for training machine learning models.'
      }
    },
    {
      step: 3,
      badge: 'STAGE 03',
      title: 'From Data to Prediction',
      subtitle: 'Multi-target machine learning surrogates predicting 28-day performance in real time',
      icon: <Cpu size={22} />,
      content: {
        heading: 'Non-Linear Hydration & Strength Regression',
        description: 'Trained ensemble models learn the complex pozzolanic interaction between fly ash silica, calcium hydroxide (lime), and gypsum ettringite formation to predict compressive strength and water absorption simultaneously.',
        visual: (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>PREDICTED STRENGTH</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '2px' }} className="font-mono">17.2 MPa</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>IS 12894: Class 15</div>
            </div>
            <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>WATER ABSORPTION</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-secondary)', marginTop: '2px' }} className="font-mono">11.4%</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--status-success)' }}>Pass (≤ 20% limit)</div>
            </div>
          </div>
        ),
        benefit: 'Replaces weeks of laboratory specimen casting with instant computational estimates.'
      }
    },
    {
      step: 4,
      badge: 'STAGE 04',
      title: 'From Prediction to Optimization',
      subtitle: 'Multi-objective constrained search balancing structural strength, cost, and embodied carbon',
      icon: <Sliders size={22} />,
      content: {
        heading: 'Pareto Frontier Formulation & Feasibility Space',
        description: 'Given target engineering specifications (e.g., Strength ≥ 15 MPa, Absorption ≤ 12%), the optimization engine explores feasible chemical spaces to maximize fly ash utilization while minimizing clinker consumption.',
        visual: (
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Optimization Search Space:</span>
              <span className="font-mono" style={{ color: 'var(--accent-primary)' }}>1,400+ Mixes</span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'var(--border-medium)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ width: '85%', height: '100%', backgroundColor: 'var(--accent-primary)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Feasible Pareto Candidates:</span>
              <span className="font-mono" style={{ fontWeight: 600 }}>14 Optimal Formulations</span>
            </div>
          </div>
        ),
        benefit: 'Discovers high-durability formulations using maximal industrial byproduct ratios.'
      }
    },
    {
      step: 5,
      badge: 'STAGE 05',
      title: 'From Optimization to Decision',
      subtitle: 'Executable plant batch sheets conforming to IS 12894 and production equipment',
      icon: <CheckCircle2 size={22} />,
      content: {
        heading: 'Industrial Recommendation & Plant Batching Protocol',
        description: 'Translates theoretical mix parameters into ready-to-batch weight proportions for pan mixers, hydraulic press pressure recommendations (20-25 MPa), and water-curing schedules.',
        visual: (
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-primary)' }}>RECOMMENDED BATCH RECIPE</span>
              <span className="badge badge-emerald font-mono" style={{ fontSize: '0.68rem' }}>IS 12894: CLASS 15</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Fly Ash: <strong>65%</strong> | Lime: <strong>15%</strong> | Gypsum: <strong>5%</strong> | Sand: <strong>15%</strong> | W/B: <strong>0.14</strong>
            </div>
          </div>
        ),
        benefit: 'Bridges computational research directly to brick plant managers and operators.'
      }
    }
  ];

  return (
    <section id="pipeline-story-section" className="section" style={{ backgroundColor: 'var(--bg-surface-subtle)', position: 'relative' }}>
      <div className="container">
        <SectionHeading
          badge="02 / CONTINUOUS PIPELINE STORY"
          badgeVariant="emerald"
          title="The Complete Pipeline: From Fragmented Literature to Industrial Decisions"
          highlightWords={['Complete Pipeline', 'Industrial Decisions']}
          description="How our framework takes raw, scattered academic papers and transforms them through machine learning and multi-objective optimization into verified manufacturing settings."
          align="center"
        />

        {/* 5 Stage Connected Journey */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)', marginTop: 'var(--space-10)' }}>
          {/* Stage Selector Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {storyStages.map((st) => {
              const isSelected = selectedStoryStage === st.step;
              return (
                <button
                  key={st.step}
                  onClick={() => setSelectedStoryStage(st.step)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-4) var(--space-5)',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: isSelected ? 'var(--bg-surface)' : 'transparent',
                    border: isSelected ? '1px solid var(--border-accent)' : '1px solid var(--border-subtle)',
                    boxShadow: isSelected ? 'var(--shadow-md)' : 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all var(--transition-base)',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-surface)',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {st.icon}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span className="badge badge-subtle font-mono" style={{ fontSize: '0.65rem' }}>{st.badge}</span>
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', marginTop: '2px' }}>
                      {st.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                      {st.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Stage Detailed Walkthrough Card */}
          <div>
            {(() => {
              const active = storyStages.find((s) => s.step === selectedStoryStage) || storyStages[0];
              return (
                <GlassPanel
                  elevation="high"
                  padding="lg"
                  accentBorder
                  style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                    <span className="badge badge-emerald">{active.badge} DEEP DIVE</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>Step {active.step} of 5</span>
                  </div>

                  <h3 style={{ fontSize: '1.45rem', fontWeight: 700, marginBottom: 'var(--space-3)', color: 'var(--text-primary)' }}>
                    {active.content.heading}
                  </h3>

                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 'var(--space-6)' }}>
                    {active.content.description}
                  </p>

                  <div style={{ marginBottom: 'var(--space-6)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 'var(--space-2)' }}>
                      Illustrative Stage Output (Simulated):
                    </div>
                    {active.content.visual}
                  </div>

                  <div
                    style={{
                      marginTop: 'auto',
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--accent-primary-subtle)',
                      border: '1px solid var(--accent-primary-light)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <CheckCircle2 size={20} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      <strong>Engineering Outcome:</strong> {active.content.benefit}
                    </span>
                  </div>
                </GlassPanel>
              );
            })()}
          </div>
        </div>
      </div>
    </section>
  );
};
