import React from 'react';
import { SectionHeading } from '../common/SectionHeading';
import { GlassPanel } from '../common/GlassPanel';
import { RESEARCH_STANDARDS, RESEARCH_KEY_FACTS } from '../../data/researchMethodology';
import { ShieldCheck, BookOpen, FileCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../common/Button';

export const ResearchTrustSection: React.FC = () => {
  return (
    <section className="section" style={{ backgroundColor: 'var(--bg-app)', position: 'relative' }}>
      <div className="container">
        <SectionHeading
          badge="07 / SCIENTIFIC RIGOR & STANDARDS"
          badgeVariant="emerald"
          title="Grounded in Civil Engineering Standards & Materials Science"
          highlightWords={['Civil Engineering Standards', 'Materials Science']}
          description="Built upon established Bureau of Indian Standards (BIS) and ASTM protocols, ensuring all extracted data and recommended mixes comply with structural masonry codes."
          align="left"
        />

        {/* Standards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-6)',
            marginBottom: 'var(--space-12)',
          }}
        >
          {RESEARCH_STANDARDS.map((std, i) => (
            <GlassPanel key={i} padding="md" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                <span className="badge badge-emerald font-mono" style={{ fontSize: '0.72rem' }}>
                  {std.code}
                </span>
                <ShieldCheck size={16} color="var(--accent-primary)" />
              </div>

              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                {std.title}
              </h4>

              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>
                Authority: {std.authority}
              </div>

              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginTop: 'auto' }}>
                {std.scope}
              </p>
            </GlassPanel>
          ))}
        </div>

        {/* Research Problem Statement & Motivation */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--space-8)',
            alignItems: 'center',
            backgroundColor: 'var(--bg-surface)',
            padding: 'var(--space-8)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <span className="badge badge-subtle">ACADEMIC RESEARCH SCOPE</span>
            </div>
            <h3 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.25, marginBottom: 'var(--space-4)' }}>
              Addressing the Literature Fragmentation Problem
            </h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 'var(--space-4)' }}>
              Decades of experimental research on fly ash bricks remain buried in heterogeneous journal tables. Authors report mixes using non-standardized units, missing chemical constituent percentages, or lacking reproducible curing conditions.
            </p>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 'var(--space-6)' }}>
              This B.Tech Computer Engineering research project bridges that divide by establishing an automated literature extraction pipeline, a clean benchmark dataset, and machine learning models for adaptive quality prediction and sustainable mix optimization.
            </p>

            <Link to="/research/methodology">
              <Button variant="outline" size="sm" icon={<BookOpen size={14} />} iconPosition="left">
                Read Computational Methodology
              </Button>
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {RESEARCH_KEY_FACTS.map((fact, idx) => (
              <div
                key={idx}
                style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
                  <FileCheck size={16} color="var(--accent-primary)" />
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {fact.title}
                  </span>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {fact.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
