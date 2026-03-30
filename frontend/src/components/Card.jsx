import React from 'react';
import './Card.css';

export default function Card({ children, className = '', hoverEffect = false, noPadding = false }) {
  let classes = `app-card ${className}`;
  if (hoverEffect) classes += ' hover-effect';
  if (noPadding) classes += ' no-padding';

  return (
    <div className={classes}>
      {children}
    </div>
  );
}
