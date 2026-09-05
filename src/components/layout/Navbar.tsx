import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layers, ChevronDown, Menu, X, ArrowRight, BookOpen, Database, Cpu, Compass } from 'lucide-react';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { Button } from '../common/Button';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [platformDropdown, setPlatformDropdown] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer and dropdown on route change
  useEffect(() => {
    setMobileOpen(false);
    setPlatformDropdown(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItemStyle = (path: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.9rem',
    fontWeight: isActive(path) ? 600 : 500,
    color: isActive(path) ? 'var(--accent-primary)' : 'var(--text-secondary)',
    padding: '0.4rem 0.75rem',
    borderRadius: 'var(--radius-sm)',
    transition: 'color var(--transition-fast), background-color var(--transition-fast)',
    backgroundColor: isActive(path) ? 'var(--accent-primary-subtle)' : 'transparent',
  });

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-sticky)',
        width: '100%',
        backgroundColor: scrolled
          ? 'var(--bg-surface-translucent)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled
          ? '1px solid var(--border-subtle)'
          : '1px solid transparent',
        boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
        transition: 'all 240ms ease',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: scrolled ? '64px' : '74px', transition: 'height 240ms ease' }}>
        {/* Brand Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px var(--accent-primary-subtle)',
            }}
          >
            <Layers size={20} strokeWidth={2.4} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '1.12rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
                lineHeight: 1.1,
              }}
            >
              FlyAsh <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Intel</span>
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-tertiary)',
              }}
            >
              Research Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
          }}
          className="desktop-nav"
        >
          {/* Platform Dropdown */}
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setPlatformDropdown(true)}
            onMouseLeave={() => setPlatformDropdown(false)}
          >
            <button
              style={{
                ...navItemStyle('/platform'),
                cursor: 'pointer',
              }}
              onClick={() => setPlatformDropdown(!platformDropdown)}
              aria-expanded={platformDropdown}
            >
              <span>Platform</span>
              <ChevronDown size={14} style={{ transform: platformDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }} />
            </button>

            {platformDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '280px',
                  padding: 'var(--space-2)',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-medium)',
                  boxShadow: 'var(--shadow-xl)',
                  animation: 'fadeIn 180ms ease forwards',
                  zIndex: 20,
                }}
              >
                <Link
                  to="/platform"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                  className="dropdown-link"
                >
                  <Compass size={16} color="var(--accent-primary)" />
                  <div>
                    <div>Platform Hub</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>Workflow Overview & Launcher</div>
                  </div>
                </Link>

                <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: 'var(--space-1) 0' }} />

                <Link
                  to="/platform/extraction"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                  }}
                  className="dropdown-link"
                >
                  <BookOpen size={16} color="var(--accent-secondary)" />
                  <div>
                    <div>01. Literature Extraction</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PDF table ingestion & OCR</div>
                  </div>
                </Link>

                <Link
                  to="/platform/dataset"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                  }}
                  className="dropdown-link"
                >
                  <Database size={16} color="var(--accent-primary)" />
                  <div>
                    <div>02. Benchmark Dataset</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Standardized mix repository</div>
                  </div>
                </Link>

                <Link
                  to="/platform/prediction"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                  }}
                  className="dropdown-link"
                >
                  <Cpu size={16} color="var(--accent-mineral)" />
                  <div>
                    <div>03. AI Quality Prediction</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Strength & absorption curves</div>
                  </div>
                </Link>

                <Link
                  to="/platform/optimization"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                  }}
                  className="dropdown-link"
                >
                  <Layers size={16} color="var(--accent-primary)" />
                  <div>
                    <div>04. Mix Optimizer</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Constrained Pareto search</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          <Link to="/research" style={navItemStyle('/research')}>
            Research
          </Link>
          <Link to="/research/methodology" style={navItemStyle('/research/methodology')}>
            Methodology
          </Link>
          <Link to="/about" style={navItemStyle('/about')}>
            About
          </Link>
        </nav>

        {/* Right CTA & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }} className="desktop-controls">
          <ThemeSwitcher />
          <Link to="/platform">
            <Button
              variant="primary"
              size="sm"
              icon={<ArrowRight size={14} />}
              iconPosition="right"
            >
              Launch Platform
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div style={{ display: 'none', alignItems: 'center', gap: 'var(--space-2)' }} className="mobile-toggle">
          <ThemeSwitcher compact />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            style={{
              padding: '8px',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            top: '64px',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--bg-surface)',
            padding: 'var(--space-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
            overflowY: 'auto',
            borderTop: '1px solid var(--border-subtle)',
            zIndex: 'var(--z-drawer)',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Navigation
          </div>
          <Link to="/" style={{ fontSize: '1.1rem', fontWeight: 600, padding: 'var(--space-2) 0' }}>
            Home
          </Link>
          <Link to="/platform" style={{ fontSize: '1.1rem', fontWeight: 600, padding: 'var(--space-2) 0' }}>
            Platform Overview
          </Link>
          <div style={{ paddingLeft: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <Link to="/platform/extraction" style={{ color: 'var(--text-secondary)' }}>• Literature Extraction</Link>
            <Link to="/platform/dataset" style={{ color: 'var(--text-secondary)' }}>• Benchmark Dataset</Link>
            <Link to="/platform/prediction" style={{ color: 'var(--text-secondary)' }}>• AI Quality Prediction</Link>
            <Link to="/platform/optimization" style={{ color: 'var(--text-secondary)' }}>• Mix Optimizer</Link>
          </div>
          <Link to="/research" style={{ fontSize: '1.1rem', fontWeight: 600, padding: 'var(--space-2) 0' }}>
            Research Background
          </Link>
          <Link to="/research/methodology" style={{ fontSize: '1.1rem', fontWeight: 600, padding: 'var(--space-2) 0' }}>
            Methodology & Pipeline
          </Link>
          <Link to="/about" style={{ fontSize: '1.1rem', fontWeight: 600, padding: 'var(--space-2) 0' }}>
            Project & Team
          </Link>

          <div style={{ marginTop: 'auto', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--border-subtle)' }}>
            <Link to="/platform" style={{ width: '100%', display: 'block' }}>
              <Button variant="primary" style={{ width: '100%' }}>
                Launch Platform Workbench
              </Button>
            </Link>
          </div>
        </div>
      )}

      <style>{`
        .dropdown-link:hover {
          background-color: var(--accent-primary-subtle);
          color: var(--accent-primary) !important;
        }
        @media (max-width: 860px) {
          .desktop-nav, .desktop-controls {
            display: none !important;
          }
          .mobile-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
};
