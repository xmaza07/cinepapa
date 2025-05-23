import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LogoProps {
  className?: string;
}

/**
 * A distinctive, monochromatic logo component for the Let's Stream navigation bar.
 * Features overlapping letters, dynamic hover effects, and professional styling.
 */
export const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <span
      className={`lets-stream-logo ${className}`}
      style={{
        color: 'inherit',
        fontSize: '1.7em',
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontWeight: '700',
        marginRight: '8px',
        verticalAlign: 'middle',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.3s ease',
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.1em 0.3em',
        borderRadius: '4px',
        background: isHovered ? 'rgba(currentColor, 0.1)' : 'transparent',
      }}
      title="Let's Stream"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate('/')}
    >
      <span style={{
        position: 'relative',
        display: 'inline-flex',
        letterSpacing: '-0.05em',
      }}>
        <span style={{
          position: 'relative',
          zIndex: 2,
          background: isHovered ? 
            'linear-gradient(135deg, currentColor 0%, rgba(currentColor, 0.8) 100%)' : 
            'currentColor',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: isHovered ? 'transparent' : 'inherit',
          filter: isHovered ? 'drop-shadow(0 0 1px rgba(currentColor, 0.3))' : 'none',
        }}>
          L
        </span>
        <span style={{
          marginLeft: '-0.15em',
          position: 'relative',
          zIndex: 1,
          background: isHovered ? 
            'linear-gradient(135deg, currentColor 0%, rgba(currentColor, 0.8) 100%)' : 
            'currentColor',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: isHovered ? 'transparent' : 'inherit',
        }}>
          S
        </span>
      </span>
      <span 
        style={{
          position: 'absolute',
          left: '0.3em',
          right: '0.3em',
          bottom: '0.1em',
          height: '2px',
          background: 'currentColor',
          transform: isHovered ? 'scaleX(1)' : 'scaleX(0)',
          transformOrigin: 'left',
          transition: 'transform 0.3s ease',
          opacity: 0.5,
          borderRadius: '1px',
        }}
      />
    </span>
  );
};

export default Logo;
