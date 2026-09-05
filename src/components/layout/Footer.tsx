import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, ShieldCheck, GitBranch, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: 'var(--space-16)',
        paddingBottom: 'var(--space-12)',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-10)',
            marginBottom: 'var(--space-12)',
          }}
        >
          {/* Brand & Project Mission */}
          <div style={{ gridColumn: 'span 1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Layers size={18} />
              </div>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                FlyAsh <span style={{ color: 'var(--accent-primary)' }}>Intel</span>
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              AI-Driven Intelligent Benchmark Dataset and Adaptive Optimization Framework for Sustainable Fly Ash Brick Manufacturing.
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: '0.35rem 0.75rem',
                backgroundColor: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.75rem',
                color: 'var(--text-tertiary)',
              }}
            >
              <Cpu size={14} color="var(--accent-primary)" />
              <span>B.Tech Computer Engineering Research</span>
            </div>
          </div>

          {/* Platform Engines */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
              Platform Modules
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: '0.88rem' }}>
              <li>
                <Link to="/platform/extraction" style={{ color: 'var(--text-secondary)' }} className="footer-link">
                  01. Literature Data Extraction
                </Link>
              </li>
              <li>
                <Link to="/platform/dataset" style={{ color: 'var(--text-secondary)' }} className="footer-link">
                  02. Benchmark Dataset & Validator
                </Link>
              </li>
              <li>
                <Link to="/platform/prediction" style={{ color: 'var(--text-secondary)' }} className="footer-link">
                  03. Adaptive AI Prediction Engine
                </Link>
              </li>
              <li>
                <Link to="/platform/optimization" style={{ color: 'var(--text-secondary)' }} className="footer-link">
                  04. Manufacturing Mix Optimizer
                </Link>
              </li>
            </ul>
          </div>

          {/* Research & Compliance */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
              Standardization & Codes
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <ShieldCheck size={14} color="var(--status-success)" />
                <span>IS 12894:2002 (PFA-Lime Bricks)</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <ShieldCheck size={14} color="var(--status-success)" />
                <span>IS 3812:2013 Part 1 (Pozzolanic Ash)</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <ShieldCheck size={14} color="var(--status-success)" />
                <span>IS 3495 (Compressive & Absorption Tests)</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <ShieldCheck size={14} color="var(--status-success)" />
                <span>ASTM C618-22 (Class F / C Standards)</span>
              </li>
            </ul>
          </div>

          {/* Research Documents */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
              Documentation
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: '0.88rem' }}>
              <li>
                <Link to="/research" style={{ color: 'var(--text-secondary)' }} className="footer-link">
                  Research Synopsis & Objectives
                </Link>
              </li>
              <li>
                <Link to="/research/methodology" style={{ color: 'var(--text-secondary)' }} className="footer-link">
                  Computational Architecture
                </Link>
              </li>
              <li>
                <Link to="/about" style={{ color: 'var(--text-secondary)' }} className="footer-link">
                  Project Scope & Academic Team
                </Link>
              </li>
              <li>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <GitBranch size={12} /> Frontend Foundation v0.1.0
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div
          style={{
            paddingTop: 'var(--space-6)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}
        >
          <div>
            © {new Date().getFullYear()} FlyAsh Intel Research Group. Developed for academic research and sustainable materials intelligence.
          </div>
          <div
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.74rem',
            }}
          >
            Academic Prototype Notice: Demonstrative dataset values used for interface evaluation
          </div>
        </div>
      </div>

      <style>{`
        .footer-link:hover {
          color: var(--accent-primary) !important;
          padding-left: 2px;
          transition: all 150ms ease;
        }
      `}</style>
    </footer>
  );
};
