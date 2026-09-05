import React from 'react';
import { SectionHeading } from '../components/common/SectionHeading';
import { GlassPanel } from '../components/common/GlassPanel';
import { RESEARCH_STANDARDS } from '../data/researchMethodology';
import { BookOpen, ShieldCheck, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';

export const ResearchPage: React.FC = () => {
  return (
    <div style={{ padding: 'var(--space-12) 0 var(--space-20)' }}>
      <div className="container">
        {/* Header */}
        <SectionHeading
          badge="RESEARCH BACKGROUND & CONTEXT"
          badgeVariant="emerald"
          title="Sustainable Fly Ash Utilization in Modern Civil Engineering"
          highlightWords={['Fly Ash Utilization', 'Civil Engineering']}
          description="Investigating the materials science, pozzolanic chemistry, and ecological imperatives driving computational benchmarking in masonry manufacturing."
        />

        {/* 3 Pillars Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--space-6)',
            marginBottom: 'var(--space-12)',
          }}
        >
          <GlassPanel padding="lg">
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-primary-subtle)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
              <Leaf size={22} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              Ecological Imperative
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              India generates upwards of 280 million metric tonnes of coal fly ash per year. Unused ash creates vast slurry ponds that jeopardize groundwater. Simultaneously, conventional brick kilns consume fertile agricultural topsoil and burn millions of tonnes of coal.
            </p>
          </GlassPanel>

          <GlassPanel padding="lg">
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-secondary-subtle)', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
              <ShieldCheck size={22} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              Pozzolanic Chemistry
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Unlike red clay bricks which undergo ceramic vitrification at ~1000°C, fly ash-lime-gypsum (FaL-G) bricks harden via exothermic hydration reactions at ambient temperatures, synthesizing calcium silicate hydrate (C-S-H) and ettringite crystals.
            </p>
          </GlassPanel>

          <GlassPanel padding="lg">
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-mineral-subtle)', color: 'var(--accent-mineral)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
              <BookOpen size={22} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              Literature Gap
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              While empirical tests abound, experiments are reported across hundreds of disconnected papers with disparate chemical reporting units and non-uniform testing ages. This project establishes the first standardized benchmark dataset for computational modeling.
            </p>
          </GlassPanel>
        </div>

        {/* Bureau of Indian Standards Section */}
        <div style={{ marginBottom: 'var(--space-12)' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--space-6)' }}>
            Governing Standards Framework (BIS & ASTM)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
            {RESEARCH_STANDARDS.map((s, idx) => (
              <GlassPanel key={idx} padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <span className="badge badge-emerald font-mono">{s.code}</span>
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>{s.title}</h4>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>{s.authority}</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{s.scope}</p>
              </GlassPanel>
            ))}
          </div>
        </div>

        {/* CTA to Methodology */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Link to="/research/methodology">
            <Button variant="primary" size="lg" icon={<BookOpen size={16} />}>
              Explore Computational Methodology & ML Architecture
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
