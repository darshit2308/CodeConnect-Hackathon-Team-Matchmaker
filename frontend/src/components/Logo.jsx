import React from 'react';

export default function Logo({ size = 32, dark = false }) {
  const primary = dark ? '#FFFFFF' : 'var(--primary)';
  const secondary = dark ? 'var(--accent)' : 'var(--ink)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="url(#paint0_linear)" />
        <path d="M14 20L20 14L26 20" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 20L20 26L26 20" stroke="rgba(255,255,255,0.7)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="paint0_linear" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2558D4" />
            <stop offset="1" stopColor="#02A994" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 850, fontSize: `${size * 0.65}px`, letterSpacing: '-0.5px' }}>
        <span style={{ color: primary }}>Code</span>
        <span style={{ color: secondary }}>Connect</span>
      </div>
    </div>
  );
}
