import React from 'react';
import { SectionHeading } from '../components/common/SectionHeading';
import { GlassPanel } from '../components/common/GlassPanel';
import { Cpu, ShieldCheck, GraduationCap, FileCheck } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div style={{ padding: 'var(--space-12) 0 var(--space-20)' }}>
      <div className="container">
        <SectionHeading
          badge="PROJECT SPECIFICATIONS & CREDITS"
          badgeVariant="emerald"
          title="About the Research Platform"
          highlightWords={['Research Platform']}
          description="A multi-disciplinary final-year B.Tech engineering initiative bridging Computer Science & Engineering with Sustainable Civil Materials."
        />

        {/* Project Card */}
        <GlassPanel padding="lg" accentBorder style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--accent-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={24} />
            </div>
            <div>
              <span className="badge badge-subtle font-mono">B.TECH FINAL YEAR CAPSTONE PROJECT</span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                AI-Driven Intelligent Benchmark Dataset and Adaptive Optimization Framework for Sustainable Fly Ash Brick Manufacturing
              </h3>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Department</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px' }}>Computer Engineering</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Focus Area</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px' }}>Applied ML & Materials Informatics</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Standard Baseline</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px' }}>IS 12894:2002 & IS 3812</div>
            </div>
          </div>
        </GlassPanel>

        {/* Research Objectives */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
          <GlassPanel padding="md">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <FileCheck size={18} color="var(--accent-primary)" />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Literature Normalization</h4>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Consolidating scattered laboratory data from hundreds of academic papers into a standardized open-access benchmark corpus.
            </p>
          </GlassPanel>

          <GlassPanel padding="md">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <Cpu size={18} color="var(--accent-secondary)" />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Surrogate AI Regressors</h4>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Developing multi-output ensemble machine learning models to forecast 28-day compressive strength and water absorption instantly.
            </p>
          </GlassPanel>

          <GlassPanel padding="md">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <ShieldCheck size={18} color="var(--accent-mineral)" />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Adaptive Mix Optimizer</h4>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Formulating constrained Pareto optimization algorithms to generate viable factory batch sheets for brick manufacturers.
            </p>
          </GlassPanel>
        </div>

        {/* Project Research Team */}
        <div style={{ marginTop: 'var(--space-12)' }}>
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <span className="editorial-eyebrow">RESEARCH COLLABORATORS</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              Project Team
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Department of Computer Engineering &bull; B.Tech Capstone Research Group
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {[
              { name: 'Swayam Mandhani', role: 'Applied ML & Platform Architecture' },
              { name: 'Pruthviraj Mule', role: 'Data Engineering & Optimization' },
              { name: 'Khush Paliwal', role: 'ML Modeling & Evaluation' },
              { name: 'Rohan Mungse', role: 'Pipeline Ingestion & UI/UX Engineering' },
            ].map((member) => (
              <GlassPanel key={member.name} padding="md" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {member.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  {member.role}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  B.Tech Computer Engineering
                </div>
              </GlassPanel>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
