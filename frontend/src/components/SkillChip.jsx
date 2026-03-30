import React from 'react';
import './SkillChip.css';

export default function SkillChip({ label, selected, onClick, onRemove, readonly, size = 'normal' }) {
  let classes = `skill-chip size-${size}`;
  if (selected) classes += ' selected';
  if (readonly) classes += ' readonly';

  return (
    <div className={classes} onClick={readonly ? undefined : onClick}>
      {label}
      {onRemove && !readonly && (
        <span className="chip-remove" onClick={(e) => { e.stopPropagation(); onRemove(label); }}>
          ✕
        </span>
      )}
    </div>
  );
}
