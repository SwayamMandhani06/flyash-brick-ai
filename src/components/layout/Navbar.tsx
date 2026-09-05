import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layers, ChevronDown, Menu, X, ArrowRight, ArrowLeft, BookOpen, Database, Cpu, Sliders, Home } from 'lucide-react';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { Button } from '../common/Button';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [platformDropdown, setPlatformDropdown] = useState(false);
  const location = useLocation();

  const isApplicationMode = location.pathname.startsWith('/platform');

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
    if (path === '/platform') return location.pathname === '/platform';
    return location.pathname.startsWith(path);
  };

  const navItemStyle = (path: string): React.CSSProperties => {
    const active = isActive(path);
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      fontSize: '0.86rem',
      fontWeight: active ? 600 : 500,
      color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
      padding: '0.35rem 0.65rem',
      borderRadius: 'var(--radius-sm)',
      transition: 'color var(--transition-fast), background-color var(--transition-fast)',
      backgroundColor: active ? 'var(--accent-primary-subtle)' : 'transparent',
      whiteSpace: 'nowrap',
      textDecoration: 'none',
    };
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-sticky)',
        width: '100%',
        backgroundColor: scrolled
          ? 'var(--bg-surface-translucent)'
          : isApplicationMode
          ? 'var(--bg-surface)'
          : 'transparent',
        backdropFilter: scrolled || isApplicationMode ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled || isApplicationMode ? 'blur(16px)' : 'none',
        borderBottom: isApplicationMode
          ? '1px solid var(--border-medium)'
          : scrolled
          ? '1px solid var(--border-subtle)'
          : '1px solid transparent',
        boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
        transition: 'all 200ms ease',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: isApplicationMode ? '60px' : scrolled ? '64px' : '72px',
          transition: 'height 200ms ease',
        }}
      >
        {/* Brand Logo & Contextual Mode Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Link
            to={isApplicationMode ? '/platform' : '/'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px var(--accent-primary-subtle)',
              }}
            >
              <Layers size={18} strokeWidth={2.4} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '1.08rem',
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
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: isApplicationMode ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {isApplicationMode ? (
                  <>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--status-success)' }} />
                    Engineering Workstation
                  </>
                ) : (
                  'Research Intelligence Platform'
                )}
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
          }}
          className="desktop-nav"
        >
          {isApplicationMode ? (
            /* APPLICATION MODE NAVIGATION */
            <>
              <Link to="/platform" style={navItemStyle('/platform')}>
                <Home size={14} />
                <span>Overview</span>
              </Link>
              <Link to="/platform/extraction" style={navItemStyle('/platform/extraction')}>
                <BookOpen size={14} />
                <span>01 Literature Extraction</span>
              </Link>
              <Link to="/platform/dataset" style={navItemStyle('/platform/dataset')}>
                <Database size={14} />
                <span>02 Benchmark Dataset</span>
              </Link>
              <Link to="/platform/prediction" style={navItemStyle('/platform/prediction')}>
                <Cpu size={14} />
                <span>03 AI Quality Prediction</span>
              </Link>
              <Link to="/platform/optimization" style={navItemStyle('/platform/optimization')}>
                <Sliders size={14} />
                <span>04 Mix Optimizer</span>
              </Link>
            </>
          ) : (
            /* PUBLIC WEBSITE NAVIGATION */
            <>
              {/* Platform Dropdown Preview */}
              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => setPlatformDropdown(true)}
                onMouseLeave={() => setPlatformDropdown(false)}
              >
                <button
                  style={{
                    ...navItemStyle('/platform'),
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: platformDropdown ? 'var(--accent-primary-subtle)' : 'transparent',
                  }}
                  onClick={() => setPlatformDropdown(!platformDropdown)}
                  aria-expanded={platformDropdown}
                >
                  <span>Platform</span>
                  <ChevronDown
                    size={13}
                    style={{
                      transform: platformDropdown ? 'rotate(180deg)' : 'none',
                      transition: 'transform 200ms ease',
                    }}
                  />
                </button>

                {platformDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      width: '290px',
                      padding: 'var(--space-2)',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-medium)',
                      boxShadow: 'var(--shadow-xl)',
                      animation: 'fadeIn 160ms ease forwards',
                      zIndex: 30,
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
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                      }}
                      className="dropdown-link"
                    >
                      <Layers size={16} color="var(--accent-primary)" />
                      <div>
                        <div>Platform Overview</div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                          Architecture & pipeline launcher
                        </div>
                      </div>
                    </Link>

                    <div style={{ height: '1px', backgroundColor: 'var(--border-hairline)', margin: 'var(--space-1) 0' }} />

                    <Link
                      to="/platform/extraction"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        padding: 'var(--space-2) var(--space-3)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.84rem',
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                      }}
                      className="dropdown-link"
                    >
                      <BookOpen size={15} color="var(--accent-secondary)" />
                      <div>
                        <div style={{ fontWeight: 600 }}>01 Literature Extraction</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PDF table ingestion & OCR</div>
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
                        fontSize: '0.84rem',
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                      }}
                      className="dropdown-link"
                    >
                      <Database size={15} color="var(--accent-primary)" />
                      <div>
                        <div style={{ fontWeight: 600 }}>02 Benchmark Dataset</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Standardized mix repository</div>
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
                        fontSize: '0.84rem',
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                      }}
                      className="dropdown-link"
                    >
                      <Cpu size={15} color="var(--accent-mineral)" />
                      <div>
                        <div style={{ fontWeight: 600 }}>03 AI Quality Prediction</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Strength & absorption surrogates</div>
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
                        fontSize: '0.84rem',
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                      }}
                      className="dropdown-link"
                    >
                      <Sliders size={15} color="var(--accent-primary)" />
                      <div>
                        <div style={{ fontWeight: 600 }}>04 Mix Optimizer</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Constrained Pareto batch solver</div>
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
            </>
          )}
        </nav>

        {/* Right CTA & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }} className="desktop-controls">
          <ThemeSwitcher />

          {isApplicationMode ? (
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Button
                variant="outline"
                size="sm"
                icon={<ArrowLeft size={13} />}
                iconPosition="left"
              >
                Public Website
              </Button>
            </Link>
          ) : (
            <Link to="/platform" style={{ textDecoration: 'none' }}>
              <Button
                variant="primary"
                size="sm"
                icon={<ArrowRight size={13} />}
                iconPosition="right"
              >
                Launch Platform
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div style={{ display: 'none', alignItems: 'center', gap: 'var(--space-2)' }} className="mobile-toggle">
          <ThemeSwitcher compact />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            style={{
              padding: '7px',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface-subtle)',
            }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            top: isApplicationMode ? '60px' : '64px',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--bg-surface)',
            padding: 'var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
            overflowY: 'auto',
            borderTop: '1px solid var(--border-subtle)',
            zIndex: 'var(--z-drawer)',
          }}
        >
          {isApplicationMode ? (
            <>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Engineering Workstation Modules
              </div>
              <Link to="/platform" style={{ fontSize: '1rem', fontWeight: 600, padding: 'var(--space-2) 0', color: 'var(--text-primary)', textDecoration: 'none' }}>
                Overview Hub
              </Link>
              <Link to="/platform/extraction" style={{ fontSize: '0.95rem', padding: 'var(--space-2) 0', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                01 Literature Extraction
              </Link>
              <Link to="/platform/dataset" style={{ fontSize: '0.95rem', padding: 'var(--space-2) 0', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                02 Benchmark Dataset
              </Link>
              <Link to="/platform/prediction" style={{ fontSize: '0.95rem', padding: 'var(--space-2) 0', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                03 AI Quality Prediction
              </Link>
              <Link to="/platform/optimization" style={{ fontSize: '0.95rem', padding: 'var(--space-2) 0', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                04 Mix Optimizer
              </Link>

              <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
                <Link to="/" style={{ width: '100%', display: 'block', textDecoration: 'none' }}>
                  <Button variant="outline" style={{ width: '100%' }} icon={<ArrowLeft size={14} />}>
                    Return to Public Website
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Platform Navigation
              </div>
              <Link to="/" style={{ fontSize: '1rem', fontWeight: 600, padding: 'var(--space-2) 0', color: 'var(--text-primary)', textDecoration: 'none' }}>
                Home
              </Link>
              <Link to="/platform" style={{ fontSize: '1rem', fontWeight: 600, padding: 'var(--space-2) 0', color: 'var(--text-primary)', textDecoration: 'none' }}>
                Platform Workbench
              </Link>
              <div style={{ paddingLeft: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <Link to="/platform/extraction" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.88rem' }}>• 01 Literature Extraction</Link>
                <Link to="/platform/dataset" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.88rem' }}>• 02 Benchmark Dataset</Link>
                <Link to="/platform/prediction" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.88rem' }}>• 03 AI Quality Prediction</Link>
                <Link to="/platform/optimization" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.88rem' }}>• 04 Mix Optimizer</Link>
              </div>
              <Link to="/research" style={{ fontSize: '1rem', fontWeight: 600, padding: 'var(--space-2) 0', color: 'var(--text-primary)', textDecoration: 'none' }}>
                Research Background
              </Link>
              <Link to="/research/methodology" style={{ fontSize: '1rem', fontWeight: 600, padding: 'var(--space-2) 0', color: 'var(--text-primary)', textDecoration: 'none' }}>
                Methodology & Pipeline
              </Link>
              <Link to="/about" style={{ fontSize: '1rem', fontWeight: 600, padding: 'var(--space-2) 0', color: 'var(--text-primary)', textDecoration: 'none' }}>
                About Project
              </Link>

              <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
                <Link to="/platform" style={{ width: '100%', display: 'block', textDecoration: 'none' }}>
                  <Button variant="primary" style={{ width: '100%' }} icon={<ArrowRight size={14} />}>
                    Launch Engineering Workstation
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        .dropdown-link:hover {
          background-color: var(--accent-primary-subtle);
          color: var(--accent-primary) !important;
        }
        @media (max-width: 960px) {
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
