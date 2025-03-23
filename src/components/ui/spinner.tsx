import React from 'react';

interface SpinnerProps {
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ className }) => {
  return (
<div className={`spinner ${className}`}>
      <div className="spinner-inner"></div>
    </div>
  );
};

export default Spinner;
