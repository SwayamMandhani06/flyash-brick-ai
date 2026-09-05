import React from 'react';
import { Link } from 'react-router-dom';
import { GlassPanel } from '../components/common/GlassPanel';
import { Button } from '../components/common/Button';
import { Home, AlertCircle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div style={{ minHeight: 'calc(100vh - 160px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)' }}>
      <GlassPanel padding="lg" style={{ textAlign: 'center', maxWidth: '480px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--accent-mineral-subtle)', color: 'var(--accent-mineral)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-4)' }}>
          <AlertCircle size={32} />
        </div>
        <span className="badge badge-amber font-mono" style={{ marginBottom: 'var(--space-2)' }}>404 ERROR</span>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>Page Not Found</h2>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
          The requested platform module or research specification path does not exist in the routing tree.
        </p>
        <Link to="/">
          <Button variant="primary" icon={<Home size={16} />}>
            Return to Homepage
          </Button>
        </Link>
      </GlassPanel>
    </div>
  );
};
