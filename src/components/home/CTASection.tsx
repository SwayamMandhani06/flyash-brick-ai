import React from 'react';
import { Link } from 'react-router-dom';
import { GlassPanel } from '../common/GlassPanel';
import { Button } from '../common/Button';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';

export const CTASection: React.FC = () => {
  return (
    <section className="section technical-grid-bg" style={{ backgroundColor: 'var(--bg-surface-subtle)', position: 'relative' }}>
      <div className="container">
        <GlassPanel
          elevation="high"
          padding="lg"
          accentBorder
          style={{
            textAlign: 'center',
            padding: 'var(--space-16) var(--space-8)',
            background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-surface-subtle) 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Ambient Radial Light */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, var(--glow-subtle) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '780px', margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--space-4)' }}>
              <span className="badge badge-emerald">
                <Sparkles size={12} />
                Sustainable Materials Intelligence
              </span>
            </div>

            <h2
              style={{
                fontSize: 'clamp(2.1rem, 3.5vw + 0.5rem, 3.2rem)',
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-4)',
              }}
            >
              From Scattered Experiments to{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Structured Intelligence
              </span>
            </h2>

            <p
              style={{
                fontSize: '1.15rem',
                lineHeight: 1.65,
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-8)',
                maxWidth: '640px',
                margin: '0 auto var(--space-8)',
              }}
            >
              Explore the workflow behind an AI-driven framework for sustainable fly ash brick manufacturing, unifying experimental literature into actionable factory formulations.
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-4)',
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
              <Link to="/research/methodology">
                <Button
                  variant="outline"
                  size="lg"
                  icon={<BookOpen size={18} />}
                  iconPosition="left"
                >
                  View Research Framework
                </Button>
              </Link>
            </div>
          </div>
        </GlassPanel>
      </div>
    </section>
  );
};
