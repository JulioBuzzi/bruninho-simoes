'use client';

// Formation layouts: positions as [x%, y%] on the field (0,0 = top-left, 100,100 = bottom-right)
// Goalkeeper always at bottom center. Field goes top = opponent side, bottom = Fla side.
// x = horizontal %, y = vertical %

const FORMATIONS = {
  '4-4-2': {
    label: '4-4-2',
    positions: [
      { role: 'GK',  x: 50,  y: 88 },
      { role: 'RB',  x: 82,  y: 73 },
      { role: 'CB',  x: 62,  y: 73 },
      { role: 'CB',  x: 38,  y: 73 },
      { role: 'LB',  x: 18,  y: 73 },
      { role: 'RM',  x: 82,  y: 50 },
      { role: 'CM',  x: 60,  y: 50 },
      { role: 'CM',  x: 40,  y: 50 },
      { role: 'LM',  x: 18,  y: 50 },
      { role: 'ST',  x: 62,  y: 22 },
      { role: 'ST',  x: 38,  y: 22 },
    ],
  },
  '4-3-3': {
    label: '4-3-3',
    positions: [
      { role: 'GK',  x: 50,  y: 88 },
      { role: 'RB',  x: 82,  y: 73 },
      { role: 'CB',  x: 62,  y: 73 },
      { role: 'CB',  x: 38,  y: 73 },
      { role: 'LB',  x: 18,  y: 73 },
      { role: 'CM',  x: 68,  y: 52 },
      { role: 'CM',  x: 50,  y: 55 },
      { role: 'CM',  x: 32,  y: 52 },
      { role: 'RW',  x: 80,  y: 22 },
      { role: 'ST',  x: 50,  y: 17 },
      { role: 'LW',  x: 20,  y: 22 },
    ],
  },
  '4-2-4': {
    label: '4-2-4',
    positions: [
      { role: 'GK',  x: 50,  y: 88 },
      { role: 'RB',  x: 82,  y: 73 },
      { role: 'CB',  x: 62,  y: 73 },
      { role: 'CB',  x: 38,  y: 73 },
      { role: 'LB',  x: 18,  y: 73 },
      { role: 'CM',  x: 62,  y: 52 },
      { role: 'CM',  x: 38,  y: 52 },
      { role: 'RW',  x: 80,  y: 22 },
      { role: 'ST',  x: 60,  y: 17 },
      { role: 'ST',  x: 40,  y: 17 },
      { role: 'LW',  x: 20,  y: 22 },
    ],
  },
  '4-1-4-1': {
    label: '4-1-4-1',
    positions: [
      { role: 'GK',  x: 50,  y: 88 },
      { role: 'RB',  x: 82,  y: 73 },
      { role: 'CB',  x: 62,  y: 73 },
      { role: 'CB',  x: 38,  y: 73 },
      { role: 'LB',  x: 18,  y: 73 },
      { role: 'DM',  x: 50,  y: 60 },
      { role: 'RM',  x: 80,  y: 44 },
      { role: 'CM',  x: 60,  y: 44 },
      { role: 'CM',  x: 40,  y: 44 },
      { role: 'LM',  x: 20,  y: 44 },
      { role: 'ST',  x: 50,  y: 17 },
    ],
  },
  '4-2-3-1': {
    label: '4-2-3-1',
    positions: [
      { role: 'GK',  x: 50,  y: 88 },
      { role: 'RB',  x: 82,  y: 73 },
      { role: 'CB',  x: 62,  y: 73 },
      { role: 'CB',  x: 38,  y: 73 },
      { role: 'LB',  x: 18,  y: 73 },
      { role: 'DM',  x: 62,  y: 59 },
      { role: 'DM',  x: 38,  y: 59 },
      { role: 'RW',  x: 78,  y: 38 },
      { role: 'AM',  x: 50,  y: 36 },
      { role: 'LW',  x: 22,  y: 38 },
      { role: 'ST',  x: 50,  y: 17 },
    ],
  },
  '3-5-2': {
    label: '3-5-2',
    positions: [
      { role: 'GK',  x: 50,  y: 88 },
      { role: 'CB',  x: 70,  y: 73 },
      { role: 'CB',  x: 50,  y: 73 },
      { role: 'CB',  x: 30,  y: 73 },
      { role: 'RM',  x: 85,  y: 50 },
      { role: 'CM',  x: 65,  y: 52 },
      { role: 'CM',  x: 50,  y: 55 },
      { role: 'CM',  x: 35,  y: 52 },
      { role: 'LM',  x: 15,  y: 50 },
      { role: 'ST',  x: 62,  y: 22 },
      { role: 'ST',  x: 38,  y: 22 },
    ],
  },
  '4-2-2-2': {
    label: '4-2-2-2',
    positions: [
      { role: 'GK',  x: 50,  y: 88 },
      { role: 'RB',  x: 82,  y: 73 },
      { role: 'CB',  x: 62,  y: 73 },
      { role: 'CB',  x: 38,  y: 73 },
      { role: 'LB',  x: 18,  y: 73 },
      { role: 'DM',  x: 62,  y: 59 },
      { role: 'DM',  x: 38,  y: 59 },
      { role: 'AM',  x: 64,  y: 38 },
      { role: 'AM',  x: 36,  y: 38 },
      { role: 'ST',  x: 62,  y: 18 },
      { role: 'ST',  x: 38,  y: 18 },
    ],
  },
};

export const FORMATION_KEYS = Object.keys(FORMATIONS);

// Editable field: lets user click a slot and assign a player
export function FootballFieldEditor({ formation, starters, players, onChange }) {
  const layout = FORMATIONS[formation] || FORMATIONS['4-4-2'];

  const handleSlotClick = (slotIndex) => {
    // Find player assigned to this slot
    const current = starters[slotIndex];
    const usedIds = starters.filter((_, i) => i !== slotIndex).map(s => s?.player_id).filter(Boolean);
    const available = players.filter(p => !usedIds.includes(p.id));

    // Simple prompt-style: cycle through or show selector via callback
    onChange('openSelector', slotIndex, available, current);
  };

  return (
    <FieldCanvas
      layout={layout}
      starters={starters}
      onSlotClick={handleSlotClick}
      editable
    />
  );
}

// Read-only display field
export function FootballFieldDisplay({ formation, starters }) {
  const layout = FORMATIONS[formation] || FORMATIONS['4-4-2'];
  return <FieldCanvas layout={layout} starters={starters} editable={false} />;
}

function FieldCanvas({ layout, starters, onSlotClick, editable }) {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 480, margin: '0 auto', userSelect: 'none' }}>
      {/* Field SVG background */}
      <svg
        viewBox="0 0 480 680"
        style={{ width: '100%', display: 'block', borderRadius: 12, overflow: 'hidden' }}
      >
        {/* Grass gradient */}
        <defs>
          <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a3a1a" />
            <stop offset="100%" stopColor="#1e4a1e" />
          </linearGradient>
          {/* Grass stripes */}
          <pattern id="stripes" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <rect width="60" height="60" fill="#1e4a1e" />
            <rect width="30" height="60" fill="#1a421a" />
          </pattern>
        </defs>

        {/* Field bg */}
        <rect width="480" height="680" fill="url(#stripes)" rx="12" />
        <rect width="480" height="680" fill="rgba(0,0,0,0.12)" rx="12" />

        {/* Outer border */}
        <rect x="24" y="24" width="432" height="632" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" rx="4" />

        {/* Center line */}
        <line x1="24" y1="340" x2="456" y2="340" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
        {/* Center circle */}
        <circle cx="240" cy="340" r="56" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
        <circle cx="240" cy="340" r="3" fill="rgba(255,255,255,0.6)" />

        {/* Penalty areas — top (opponent) */}
        <rect x="120" y="24" width="240" height="96" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <rect x="180" y="24" width="120" height="46" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
        <circle cx="240" cy="112" r="28" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" />
        <circle cx="240" cy="80" r="2.5" fill="rgba(255,255,255,0.5)" />

        {/* Penalty areas — bottom (Flamengo) */}
        <rect x="120" y="560" width="240" height="96" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <rect x="180" y="610" width="120" height="46" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
        <circle cx="240" cy="568" r="28" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" />
        <circle cx="240" cy="600" r="2.5" fill="rgba(255,255,255,0.5)" />

        {/* Corner arcs */}
        {[[24,24],[456,24],[24,656],[456,656]].map(([cx,cy],i) => (
          <path key={i} d={`M ${cx === 24 ? cx+12 : cx-12} ${cy} A 12 12 0 0 ${cx === 24 ? 1 : 0} ${cx} ${cy === 24 ? cy+12 : cy-12}`}
            fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        ))}

        {/* Goal lines */}
        <rect x="195" y="14" width="90" height="14" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
        <rect x="195" y="652" width="90" height="14" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />

        {/* Player slots */}
        {layout.positions.map((pos, i) => {
          const starter = starters?.[i];
          const px = (pos.x / 100) * 480;
          const py = (pos.y / 100) * 680;
          const hasPlayer = starter?.player_id || starter?.name;
          const playerName = starter?.name || starter?.player_name || '';
          const shortName = playerName ? playerName.split(' ').pop().slice(0, 10) : pos.role;
          const number = starter?.number || '';

          return (
            <g key={i} style={{ cursor: editable ? 'pointer' : 'default' }}
              onClick={() => editable && onSlotClick(i)}>
              {/* Shadow */}
              <circle cx={px} cy={py + 2} r="20" fill="rgba(0,0,0,0.3)" />
              {/* Circle */}
              <circle cx={px} cy={py} r="20"
                fill={hasPlayer ? '#e8001c' : 'rgba(255,255,255,0.12)'}
                stroke={hasPlayer ? '#ff6666' : 'rgba(255,255,255,0.5)'}
                strokeWidth="1.5"
              />
              {/* Number */}
              {number && (
                <text x={px} y={py - 3} textAnchor="middle" dominantBaseline="middle"
                  fill="white" fontFamily="Bebas Neue" fontSize="14" letterSpacing="0.5">
                  {number}
                </text>
              )}
              {/* Role if no player */}
              {!hasPlayer && (
                <text x={px} y={py} textAnchor="middle" dominantBaseline="middle"
                  fill="rgba(255,255,255,0.7)" fontFamily="Barlow Condensed" fontSize="10" fontWeight="700">
                  {pos.role}
                </text>
              )}
              {/* Name label below circle */}
              <rect x={px - 30} y={py + 23} width="60" height="14" rx="3"
                fill={hasPlayer ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.35)'} />
              <text x={px} y={py + 30} textAnchor="middle"
                fill={hasPlayer ? 'white' : 'rgba(255,255,255,0.5)'}
                fontFamily="Barlow Condensed" fontSize="10" fontWeight="600">
                {shortName.length > 10 ? shortName.slice(0, 10) : shortName}
              </text>
              {/* Edit indicator */}
              {editable && !hasPlayer && (
                <text x={px} y={py + 1} textAnchor="middle" dominantBaseline="middle"
                  fill="rgba(255,255,255,0.5)" fontFamily="Arial" fontSize="16">+</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default FootballFieldDisplay;