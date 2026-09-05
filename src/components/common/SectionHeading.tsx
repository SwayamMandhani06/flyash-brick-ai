import React from 'react';

interface SectionHeadingProps {
  badge?: string;
  badgeVariant?: 'emerald' | 'teal' | 'amber' | 'subtle';
  title: string;
  highlightWords?: string[];
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  badge,
  badgeVariant = 'emerald',
  title,
  highlightWords = [],
  description,
  align = 'left',
  className = '',
}) => {
  // Utility to highlight specific key phrases with subtle accent color
  const renderTitle = () => {
    if (!highlightWords.length) return title;
    
    let parts: (string | React.ReactNode)[] = [title];
    highlightWords.forEach((word) => {
      const newParts: (string | React.ReactNode)[] = [];
      parts.forEach((part) => {
        if (typeof part === 'string') {
          const split = part.split(new RegExp(`(${word})`, 'gi'));
          split.forEach((subPart, i) => {
            if (subPart.toLowerCase() === word.toLowerCase()) {
              newParts.push(
                <span
                  key={`${word}-${i}`}
                  style={{
                    color: 'var(--accent-primary)',
                    position: 'relative',
                    display: 'inline-block',
                  }}
                >
                  {subPart}
                </span>
              );
            } else if (subPart) {
              newParts.push(subPart);
            }
          });
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });
    return parts;
  };

  return (
    <div
      style={{
        textAlign: align,
        marginBottom: 'var(--space-12)',
        maxWidth: align === 'center' ? '820px' : '720px',
        marginLeft: align === 'center' ? 'auto' : undefined,
        marginRight: align === 'center' ? 'auto' : undefined,
      }}
      className={className}
    >
      {badge && (
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <span className={`badge badge-${badgeVariant}`}>
            {badge}
          </span>
        </div>
      )}
      <h2
        style={{
          fontSize: 'clamp(1.85rem, 3vw + 0.5rem, 2.75rem)',
          fontWeight: 700,
          lineHeight: 1.18,
          letterSpacing: '-0.025em',
          color: 'var(--text-primary)',
          marginBottom: description ? 'var(--space-4)' : 0,
        }}
      >
        {renderTitle()}
      </h2>
      {description && (
        <p
          style={{
            fontSize: '1.05rem',
            lineHeight: 1.65,
            color: 'var(--text-secondary)',
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
};
