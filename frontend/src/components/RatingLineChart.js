'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

// Gráfico de linha com a média por jogo (usado na Evolução e no perfil do jogador).
// games: [{ match_id, match_date, avg_rating, opponent_name, opponent_logo, flamengo_goals, opponent_goals }]
// Clicar no escudo do adversário abre a página do jogo.
export default function RatingLineChart({ games, title, subtitle = 'Clique no escudo do adversário para ver as notas', scrollToEnd = false }) {
  const router = useRouter();
  const [hovered, setHovered] = useState(null);
  const gradId = 'grad-' + useId().replace(/:/g, '');
  const scrollRef = useRef(null);
  // No perfil do jogador o gráfico pode ser largo: começa mostrando os jogos mais recentes
  useEffect(() => {
    if (scrollToEnd && scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
  }, [scrollToEnd, games]);
  if (!games || games.length === 0) return null;
  const H = 300;
  const PAD = { top: 44, right: 32, bottom: 80, left: 48 };
  // Largura cresce com o número de jogos (espaço fixo entre eles), em vez de esticar tudo.
  // Assim, com muitos jogos, escudos e datas ficam no tamanho normal e o gráfico rola pro lado.
  const STEP = 76; // px entre um jogo e outro
  const W = Math.max(900, PAD.left + PAD.right + (games.length - 1) * STEP);
  const wide = W > 900;
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const ratings = games.map(m => parseFloat(m.avg_rating));
  const minR = Math.max(0, Math.min(...ratings) - 1.5);
  const maxR = Math.min(10, Math.max(...ratings) + 1.5);
  const toX = i => PAD.left + (games.length > 1 ? (i / (games.length - 1)) * chartW : chartW / 2);
  const toY = v => PAD.top + chartH - ((v - minR) / (maxR - minR)) * chartH;
  const pts = games.map((m, i) => `${toX(i).toFixed(1)},${toY(parseFloat(m.avg_rating)).toFixed(1)}`);
  const linePath = `M ${pts.join(' L ')}`;
  const fillPath = `M ${toX(0).toFixed(1)},${PAD.top + chartH} L ${pts.join(' L ')} L ${toX(games.length - 1).toFixed(1)},${PAD.top + chartH} Z`;
  const yTicks = [];
  for (let v = Math.ceil(minR); v <= Math.floor(maxR); v++) yTicks.push(v);

  return (
    <div className="card" style={{ padding: '20px 12px 12px', marginBottom: 20 }}>
      <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'capitalize', paddingLeft: 8 }}>
        {title}
        <span style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed', marginLeft: 10 }}>
          {games.length} jogo{games.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed', letterSpacing: '0.04em', paddingLeft: 8, marginTop: -6, marginBottom: 8 }}>
        {subtitle}
      </div>
      <div ref={scrollRef} style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: wide ? W : '100%', minWidth: wide ? W : Math.max(400, games.length * 80), height: wide ? H : 'auto', display: 'block' }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e8001c" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#e8001c" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {yTicks.map(v => (
            <g key={v}>
              <line x1={PAD.left} y1={toY(v)} x2={PAD.left + chartW} y2={toY(v)} stroke="#2a2a3a" strokeWidth="1" />
              <text x={PAD.left - 8} y={toY(v) + 4} textAnchor="end" fill="#5a5a72" fontFamily="Barlow Condensed" fontSize="12">{v}</text>
            </g>
          ))}
          <path d={fillPath} fill={`url(#${gradId})`} />
          <path d={linePath} fill="none" stroke="#e8001c" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {games.map((m, i) => {
            const x = toX(i);
            const y = toY(parseFloat(m.avg_rating));
            const rating = parseFloat(m.avg_rating);
            const color = rating >= 7 ? '#00c853' : rating >= 5 ? '#f5c842' : '#e8001c';
            const dateStr = String(m.match_date).slice(0, 10).split('-').reverse().slice(0, 2).join('/');
            const logoUrl = m.opponent_logo || null;
            const logoSize = 28;
            const logoY = PAD.top + chartH + 32;
            const isHover = hovered === i;
            const goToMatch = () => router.push(`/jogos/${m.match_id}`);
            const box = logoSize + 10; // quadrado clicável em volta da logo
            return (
              <g key={m.match_id || i}>
                {isHover && <line x1={x} y1={y + 8} x2={x} y2={PAD.top + chartH + 4} stroke={color} strokeOpacity="0.4" strokeDasharray="3 3" />}
                <circle cx={x} cy={y} r={isHover ? 8 : 6} fill={color} stroke="#0a0a0f" strokeWidth="2" />
                <text x={x} y={y - 14} textAnchor="middle" fill={color} fontFamily="Bebas Neue" fontSize="15" letterSpacing="0.03em">{rating.toFixed(1)}</text>
                <text x={x} y={PAD.top + chartH + 18} textAnchor="middle" fill="#9090a8" fontFamily="Barlow Condensed" fontSize="12" fontWeight="600">{dateStr}</text>

                {/* Só o quadrado da logo é clicável */}
                <g
                  role="link"
                  tabIndex={0}
                  aria-label={`Abrir jogo contra ${m.opponent_name} em ${dateStr}: Flamengo ${m.flamengo_goals} x ${m.opponent_goals}, média ${rating.toFixed(1)}`}
                  style={{ cursor: 'pointer', outline: 'none' }}
                  onClick={goToMatch}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToMatch(); } }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                >
                  <title>{`${m.opponent_name} · ${dateStr} · ${m.flamengo_goals}×${m.opponent_goals} — clique para abrir o jogo`}</title>
                  <rect
                    x={x - box / 2} y={logoY - 5} width={box} height={box} rx="8"
                    fill={isHover ? 'rgba(232,0,28,0.14)' : 'rgba(255,255,255,0.03)'}
                    stroke={isHover ? 'rgba(232,0,28,0.6)' : '#2a2a3a'}
                    strokeWidth="1"
                  />
                  {logoUrl
                    ? <image href={logoUrl} x={x - logoSize / 2} y={logoY} width={logoSize} height={logoSize} preserveAspectRatio="xMidYMid meet" />
                    : <text x={x} y={logoY + 18} textAnchor="middle" fill="#9090a8" fontFamily="Barlow Condensed" fontSize="12" fontWeight="600">
                        {(m.opponent_name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3)}
                      </text>
                  }
                </g>

                <text x={x} y={PAD.top + chartH + 76} textAnchor="middle" fill="#5a5a72" fontFamily="Bebas Neue" fontSize="12">{m.flamengo_goals}×{m.opponent_goals}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}