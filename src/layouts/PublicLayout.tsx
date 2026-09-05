import React from 'react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="public-layout-content" style={{ width: '100%' }}>
      {children}
    </div>
  );
};

export default PublicLayout;
