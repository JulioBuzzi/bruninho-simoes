'use client';

export default function RatingBadge({ value, size = 'md', label }) {
  const n = parseFloat(value);
  const isValid = !isNaN(n);

  let bg, color, border;
  if (!isValid) {
    bg = 'rgba(90,90,114,0.1)';
    color = 'var(--text-muted)';
    border = '1px solid var(--border)';
  } else if (n >= 8) {
    bg = 'rgba(0,200,83,0.12)';
    color = '#00e564';
    border = '1px solid rgba(0,200,83,0.3)';
  } else if (n >= 6.5) {
    bg = 'rgba(0,200,83,0.07)';
    color = 'var(--green)';
    border = '1px solid rgba(0,200,83,0.2)';
  } else if (n >= 5) {
    bg = 'rgba(245,200,66,0.1)';
    color = 'var(--gold)';
    border = '1px solid rgba(245,200,66,0.25)';
  } else if (n >= 3) {
    bg = 'rgba(255,109,0,0.1)';
    color = 'var(--orange)';
    border = '1px solid rgba(255,109,0,0.25)';
  } else {
    bg = 'rgba(232,0,28,0.1)';
    color = 'var(--red-primary)';
    border = '1px solid rgba(232,0,28,0.25)';
  }

  const sizes = {
    sm: { width: 36, height: 36, fontSize: 14 },
    md: { width: 48, height: 48, fontSize: 18 },
    lg: { width: 60, height: 60, fontSize: 24 },
  };

  const s = sizes[size] || sizes.md;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      {label && (
        <span style={{
          fontSize: 10, fontFamily: 'Barlow Condensed', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)',
        }}>{label}</span>
      )}
      <div style={{
        width: s.width, height: s.height,
        background: bg, border, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Bebas Neue', fontSize: s.fontSize,
        color, letterSpacing: '0.02em',
      }}>
        {isValid ? n.toFixed(1) : '—'}
      </div>
    </div>
  );
}
