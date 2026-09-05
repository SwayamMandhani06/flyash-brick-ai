import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';
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
        paddingTop: 'calc(var(--space-12) + 1rem)',
        paddingBottom: 'var(--space-16)',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid var(--border-hairline)',
      }}
    >
      {/* Subtle Ambient Radial Lighting */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          right: '8%',
          width: '520px',
          height: '520px',
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
          {/* Left Column: Typographic Narrative */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            {/* Delicate Editorial Eyebrow */}
            <div className="editorial-eyebrow stagger-1" style={{ marginBottom: 'var(--space-4)' }}>
              Research Platform &bull; B.Tech Computer Engineering
            </div>

            {/* Headline with 3-4 Intentional Lines on Desktop */}
            <h1
              className="stagger-2"
              style={{
                fontSize: 'clamp(2.25rem, 3.8vw + 0.5rem, 3.45rem)',
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-5)',
                maxWidth: '680px',
              }}
            >
              Turning Fly Ash Brick Research <br className="hero-desktop-br" />
              into{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Intelligent Manufacturing Decisions
              </span>
            </h1>

            {/* Concise Supporting Description */}
            <p
              className="stagger-3"
              style={{
                fontSize: '1.1rem',
                lineHeight: 1.65,
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-8)',
                maxWidth: '560px',
              }}
            >
              An AI-driven computational framework that extracts experimental literature, standardizes benchmark datasets, predicts mechanical performance, and optimizes sustainable brick manufacturing parameters.
            </p>

            {/* CTAs */}
            <div
              className="stagger-4"
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

            {/* Editorial Meta Strip with Hairline Dividers */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 'var(--space-4)',
                paddingTop: 'var(--space-4)',
                borderTop: '1px solid var(--border-hairline)',
                width: '100%',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-tertiary)',
              }}
            >
              <span>Zero-Clinker Geopolymers</span>
              <span style={{ color: 'var(--border-medium)' }}>/</span>
              <span>IS 12894:2002 Framework</span>
              <span style={{ color: 'var(--border-medium)' }}>/</span>
              <span>Constrained Pareto Search</span>
            </div>
          </div>

          {/* Right Column: Living Pipeline Graph */}
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
          .hero-desktop-br {
            display: inline;
          }
        }
        @media (max-width: 1023px) {
          .hero-desktop-br {
            display: none;
          }
        }
      `}</style>
    </section>
  );
};
