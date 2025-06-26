import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Logo.module.css';

/**
 * A distinctive, modern logo component for the Let's Stream navigation bar.
 * Features overlapping letters, dynamic gradient colors, and engaging hover effects.
 */
export const Logo: React.FC = () => {
  const navigate = useNavigate();

  return (
    <span
      title="Let's Stream"
      onClick={() => navigate('/')}
      className={styles.logo}
    >
      <span className={styles.logoL}>L</span>
      <span className={styles.logoS}>S</span>
    </span>
  );
};

export default Logo;
