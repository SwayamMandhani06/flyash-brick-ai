import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, ShieldCheck, Cpu, Leaf, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';
import { InteractivePipeline } from './InteractivePipeline';

export const HeroSection: React.FC = () => {
  const scrollToStory = () => {
    const el = document.getElementById('pipeline-story-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      className="section technical-grid-bg"
      style={{
        paddingTop: 'calc(var(--space-16) + 1rem)',
        paddingBottom: 'var(--space-20)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle Radial Ambient Illumination */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--glow-subtle) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-12)',
            alignItems: 'center',
          }}
          className="hero-grid"
        >
          {/* Left Column: Mission & CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            {/* Project Category Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <span className="badge badge-emerald">
                <Cpu size={13} />
                B.Tech Computer Engineering Research
              </span>
              <span className="badge badge-subtle">
                IS 12894:2002 Conformance
              </span>
            </div>

            {/* Main Headline */}
            <h1
              style={{
                fontSize: 'clamp(2.35rem, 3.8vw + 0.5rem, 3.5rem)',
                fontWeight: 800,
                lineHeight: 1.12,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-5)',
              }}
            >
              Turning Fragmented Fly Ash Brick Research into{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Intelligent Manufacturing
              </span>{' '}
              Decisions
            </h1>

            {/* Subtitle / Value Proposition */}
            <p
              style={{
                fontSize: '1.12rem',
                lineHeight: 1.65,
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-8)',
                maxWidth: '580px',
              }}
            >
              An end-to-end framework integrating automated literature table extraction, standardized benchmark datasets, adaptive AI quality prediction, and multi-objective manufacturing optimization for sustainable construction materials.
            </p>

            {/* CTAs */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-8)',
              }}
            >
              <Link to="/platform">
                <Button
                  variant="primary"
                  size="lg"
                  icon={<ArrowRight size={18} />}
                  iconPosition="right"
                >
                  Explore the Platform
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                icon={<Compass size={18} />}
                onClick={scrollToStory}
              >
                See How It Works
              </Button>
            </div>

            {/* Engineering Pillars Micro-Badges */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-4)',
                paddingTop: 'var(--space-5)',
                borderTop: '1px solid var(--border-subtle)',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                <Leaf size={15} color="var(--accent-primary)" />
                <span>Zero-Clinker Geopolymer Pathways</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                <ShieldCheck size={15} color="var(--accent-secondary)" />
                <span>Standardized IS 12894 Schema</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                <Sparkles size={15} color="var(--accent-mineral)" />
                <span>Constrained Pareto Mix Tuning</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Pipeline Simulation */}
          <div style={{ width: '100%' }}>
            <InteractivePipeline />
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .hero-grid {
            grid-template-columns: 1.15fr 1fr !important;
          }
        }
      `}</style>
    </section>
  );
};
