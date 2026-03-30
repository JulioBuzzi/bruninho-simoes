'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ratingsApi, matchesApi } from '../../lib/api';
import RatingBadge from '../../components/RatingBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { BarChart3, Trophy, Users } from 'lucide-react';

export default function StatisticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState(String(new Date().getFullYear()));
  const [seasons, setSeasons] = useState([String(new Date().getFullYear())]);
  const [tab, setTab] = useState('ranking');

  useEffect(() => {
    matchesApi.getSeasons().then(s => { if (s.length) setSeasons(s.map(String)); }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    ratingsApi.getStats({ season }).then(setStats).finally(() => setLoading(false));
  }, [season]);

  const tabs = [
    { id: 'ranking',   label: 'Ranking Geral',      icon: Trophy    },
    { id: 'bvs',       label: 'Bruninho vs Simões',  icon: Users     },
    { id: 'evolution', label: 'Evolução',             icon: BarChart3 },
  ];

  return (
    <div className="page-container fade-in" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <BarChart3 size={28} color="var(--red-primary)" />
        <h1 style={{ fontSize: 48 }}>Estatísticas</h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>Análise completa das notas por temporada.</p>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 160 }}>
          <label>Temporada</label>
          <select className="input" value={season} onChange={e => setSeason(e.target.value)}>
            {seasons.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 14,
            letterSpacing: '0.05em', textTransform: 'uppercase',
            color: tab === id ? 'var(--red-primary)' : 'var(--text-muted)',
            borderBottom: tab === id ? '2px solid var(--red-primary)' : '2px solid transparent',
            marginBottom: -1, transition: 'all 0.2s',
          }}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {tab === 'ranking' && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed', letterSpacing: '0.04em', marginBottom: 16 }}>
          * Apenas jogadores com 3 ou mais jogos como titular aparecem no ranking geral.
        </p>
      )}

      {loading ? <LoadingSpinner text="Calculando estatísticas..." /> : !stats ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Sem dados para esta temporada.</div>
      ) : (
        <>
          {/* ── RANKING ── */}
          {tab === 'ranking' && (
            <div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <StatHighlight icon="⭐" label="Melhor Jogador"    value={stats.ranking[0]?.name} sub={stats.ranking[0]?.avg_overall ? `Média ${Number(stats.ranking[0].avg_overall).toFixed(2)}` : ''} gold />
                <StatHighlight icon="🐟" label="Bagre da Temporada" value={stats.ranking[stats.ranking.length - 1]?.name} sub={stats.ranking[stats.ranking.length - 1]?.avg_overall ? `Média ${Number(stats.ranking[stats.ranking.length - 1].avg_overall).toFixed(2)}` : ''} />
                <StatHighlight icon="⚽" label="Máx. Jogos"         value={stats.ranking.length ? `${Math.max(...stats.ranking.map(r => r.games || 0))} jogos` : '—'} />
              </div>

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {(() => {
                  const cols = [
                    { key: '#',   label: '#',        align: 'center', w: 48  },
                    { key: 'jog', label: 'Jogador',  align: 'left',   w: 220 },
                    { key: 'pos', label: 'Pos.',     align: 'left',   w: 110 },
                    { key: 'g',   label: 'Jogos',    align: 'left',   w: 70  },
                    { key: 'bru', label: 'Bruninho', align: 'left',   w: 90  },
                    { key: 'sim', label: 'Simões',   align: 'left',   w: 90  },
                    { key: 'med', label: 'Média',    align: 'left',   w: 90  },
                    { key: 'mel', label: 'Melhor',   align: 'left',   w: 80  },
                    { key: 'cra', label: 'Craques',  align: 'left',   w: 80  },
                    { key: 'bag', label: 'Bagres',   align: 'left',   w: 70  },
                  ];
                  const thS = c => ({ padding: '12px 16px', textAlign: c.align, width: c.w, fontSize: 11, fontFamily: 'Barlow Condensed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' });
                  const tdS = (c, extra = {}) => ({ padding: '12px 16px', textAlign: c.align, ...extra });
                  return (
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-secondary)' }}>
                          {cols.map(c => <th key={c.key} style={thS(c)}>{c.label}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {stats.ranking.map((player, i) => (
                          <tr key={player.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
                          >
                            <td style={tdS(cols[0], { fontFamily: 'Bebas Neue', fontSize: 18, color: i < 3 ? 'var(--gold)' : 'var(--text-muted)' })}>{i + 1}</td>
                            <td style={tdS(cols[1])}>
                              <Link href={`/jogadores/${player.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)' }}>
                                {player.photo_url
                                  ? <img src={player.photo_url} alt={player.name} style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />
                                  : <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{player.name?.slice(0, 2).toUpperCase()}</div>
                                }
                                <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.name}</span>
                              </Link>
                            </td>
                            <td style={tdS(cols[2])}><span style={{ fontSize: 11, fontFamily: 'Barlow Condensed', color: 'var(--text-muted)' }}>{player.position}</span></td>
                            <td style={tdS(cols[3], { fontFamily: 'Barlow Condensed', fontWeight: 600 })}>{player.games}</td>
                            <td style={tdS(cols[4])}><span style={{ fontFamily: 'Barlow Condensed', fontWeight: 600, color: getRatingColor(player.avg_bruninho) }}>{player.avg_bruninho ? Number(player.avg_bruninho).toFixed(2) : '—'}</span></td>
                            <td style={tdS(cols[5])}><span style={{ fontFamily: 'Barlow Condensed', fontWeight: 600, color: getRatingColor(player.avg_simoes) }}>{player.avg_simoes ? Number(player.avg_simoes).toFixed(2) : '—'}</span></td>
                            <td style={tdS(cols[6])}><span style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: getRatingColor(player.avg_overall) }}>{player.avg_overall ? Number(player.avg_overall).toFixed(2) : '—'}</span></td>
                            <td style={tdS(cols[7])}><span style={{ color: 'var(--green)', fontFamily: 'Barlow Condensed', fontWeight: 600 }}>{player.best_game ? Number(player.best_game).toFixed(1) : '—'}</span></td>
                            <td style={tdS(cols[8])}><span style={{ color: 'var(--gold)', fontFamily: 'Barlow Condensed', fontWeight: 700 }}>{player.craque_count || 0}</span></td>
                            <td style={tdS(cols[9])}><span style={{ color: 'var(--red-primary)', fontFamily: 'Barlow Condensed', fontWeight: 700 }}>{player.bagre_count || 0}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
                {stats.ranking.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Nenhuma nota registrada nesta temporada.</div>
                )}
              </div>
            </div>
          )}

          {/* ── BRUNINHO VS SIMÕES ── */}
          {tab === 'bvs' && stats.bruninho_vs_simoes && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 600, margin: '0 auto' }}>
                <div className="card" style={{ textAlign: 'center', borderColor: 'rgba(68,138,255,0.25)', background: 'rgba(68,138,255,0.04)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎙️</div>
                  <h3 style={{ fontSize: 32, color: 'var(--blue)', marginBottom: 4 }}>Bruninho</h3>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 56, color: 'var(--blue)', lineHeight: 1 }}>{Number(stats.bruninho_vs_simoes.avg_bruninho).toFixed(2)}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Média geral</div>
                  <div style={{ marginTop: 16, padding: '12px', background: 'rgba(68,138,255,0.08)', borderRadius: 8 }}>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: 28 }}>{stats.bruninho_vs_simoes.bruninho_higher}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed' }}>vezes deu nota MAIOR</div>
                  </div>
                </div>
                <div className="card" style={{ textAlign: 'center', borderColor: 'rgba(232,0,28,0.25)', background: 'rgba(232,0,28,0.04)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎤</div>
                  <h3 style={{ fontSize: 32, color: 'var(--red-primary)', marginBottom: 4 }}>Simões</h3>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 56, color: 'var(--red-primary)', lineHeight: 1 }}>{Number(stats.bruninho_vs_simoes.avg_simoes).toFixed(2)}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Média geral</div>
                  <div style={{ marginTop: 16, padding: '12px', background: 'rgba(232,0,28,0.08)', borderRadius: 8 }}>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: 28 }}>{stats.bruninho_vs_simoes.simoes_higher}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed' }}>vezes deu nota MAIOR</div>
                  </div>
                </div>
              </div>
              <div className="card" style={{ textAlign: 'center', marginTop: 20, maxWidth: 600, margin: '20px auto 0' }}>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, color: 'var(--gold)' }}>Empates: {stats.bruninho_vs_simoes.equal}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed' }}>vezes deram a mesma nota</div>
              </div>
            </div>
          )}

          {/* ── EVOLUÇÃO ── */}
          {tab === 'evolution' && (
            <EvolutionTab matchEvolution={stats.match_evolution || []} season={season} />
          )}
        </>
      )}
    </div>
  );
}

// ─── Line chart component ───────────────────────────────────────────────────
function EvolutionTab({ matchEvolution, season }) {
  const svgRef = useRef(null);

  if (matchEvolution.length === 0) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Sem dados suficientes.</div>;
  }

  const W = 900, H = 320;
  const PAD = { top: 40, right: 40, bottom: 72, left: 52 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const ratings = matchEvolution.map(m => parseFloat(m.avg_rating));
  const minR = Math.max(0, Math.min(...ratings) - 1);
  const maxR = Math.min(10, Math.max(...ratings) + 1);

  const xStep = matchEvolution.length > 1 ? chartW / (matchEvolution.length - 1) : chartW;

  const toX = i => PAD.left + (matchEvolution.length > 1 ? i * xStep : chartW / 2);
  const toY = v => PAD.top + chartH - ((v - minR) / (maxR - minR)) * chartH;

  // Build SVG path
  const pts = matchEvolution.map((m, i) => `${toX(i).toFixed(1)},${toY(parseFloat(m.avg_rating)).toFixed(1)}`);
  const linePath = `M ${pts.join(' L ')}`;

  // Gradient fill path
  const fillPath = `M ${toX(0).toFixed(1)},${(PAD.top + chartH).toFixed(1)} L ${pts.join(' L ')} L ${toX(matchEvolution.length - 1).toFixed(1)},${(PAD.top + chartH).toFixed(1)} Z`;

  // Y axis ticks
  const yTicks = [];
  for (let v = Math.ceil(minR); v <= Math.floor(maxR); v++) {
    yTicks.push(v);
  }

  return (
    <div>
      <h3 style={{ fontSize: 24, marginBottom: 20, color: 'var(--text-secondary)', fontFamily: 'Bebas Neue', letterSpacing: '0.04em' }}>
        Média do Time por Jogo — {season}
      </h3>

      <div className="card" style={{ padding: '24px 16px', overflowX: 'auto' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', minWidth: 480, height: 'auto', display: 'block' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e8001c" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#e8001c" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map(v => (
            <g key={v}>
              <line
                x1={PAD.left} y1={toY(v).toFixed(1)}
                x2={PAD.left + chartW} y2={toY(v).toFixed(1)}
                stroke="#2a2a3a" strokeWidth="1"
              />
              <text
                x={PAD.left - 10} y={toY(v) + 4}
                textAnchor="end" fill="#5a5a72"
                fontFamily="Barlow Condensed" fontSize="12"
              >{v}</text>
            </g>
          ))}

          {/* Fill area */}
          <path d={fillPath} fill="url(#lineGrad)" />

          {/* Line */}
          <path d={linePath} fill="none" stroke="#e8001c" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

          {/* Points + labels */}
          {matchEvolution.map((m, i) => {
            const x = toX(i);
            const y = toY(parseFloat(m.avg_rating));
            const rating = parseFloat(m.avg_rating);
            const color = rating >= 7 ? '#00c853' : rating >= 5 ? '#f5c842' : '#e8001c';
            // Date label: short format
            const dateStr = m.match_date ? String(m.match_date).slice(5, 10).replace('-', '/') : `J${i + 1}`;
            const opponentShort = (m.opponent_name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);

            return (
              <g key={m.match_id}>
                {/* Dot */}
                <circle cx={x} cy={y} r="6" fill={color} stroke="#0a0a0f" strokeWidth="2" />

                {/* Rating above dot */}
                <text
                  x={x} y={y - 14}
                  textAnchor="middle" fill={color}
                  fontFamily="Bebas Neue" fontSize="14" letterSpacing="0.04em"
                >{rating.toFixed(1)}</text>

                {/* Date below x-axis */}
                <text
                  x={x} y={PAD.top + chartH + 20}
                  textAnchor="middle" fill="#9090a8"
                  fontFamily="Barlow Condensed" fontSize="11" fontWeight="600"
                >{dateStr}</text>

                {/* Opponent below date */}
                <text
                  x={x} y={PAD.top + chartH + 36}
                  textAnchor="middle" fill="#5a5a72"
                  fontFamily="Barlow Condensed" fontSize="11"
                >{opponentShort}</text>

                {/* Score */}
                <text
                  x={x} y={PAD.top + chartH + 52}
                  textAnchor="middle" fill="#5a5a72"
                  fontFamily="Bebas Neue" fontSize="11"
                >{m.flamengo_goals}×{m.opponent_goals}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Monthly summary below */}
      <h3 style={{ fontSize: 20, margin: '32px 0 16px', color: 'var(--text-secondary)', fontFamily: 'Bebas Neue', letterSpacing: '0.04em' }}>
        Média por Mês
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Object.entries(
          matchEvolution.reduce((acc, m) => {
            const month = String(m.match_date).slice(0, 7);
            if (!acc[month]) acc[month] = [];
            acc[month].push(parseFloat(m.avg_rating));
            return acc;
          }, {})
        ).map(([month, vals]) => {
          const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
          const [y, mo] = month.split('-');
          const monthName = new Date(parseInt(y), parseInt(mo) - 1).toLocaleString('pt-BR', { month: 'long' });
          const pct = (avg / 10) * 100;
          return (
            <div key={month} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 100, fontFamily: 'Barlow Condensed', fontWeight: 600, textTransform: 'capitalize', fontSize: 15 }}>{monthName}</div>
              <div style={{ flex: 1, height: 12, background: 'var(--bg-secondary)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: 6, background: `linear-gradient(90deg, ${getRatingColor(avg)}, ${getRatingColor(avg)}88)`, transition: 'width 0.6s ease' }} />
              </div>
              <span style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: getRatingColor(avg), width: 60, textAlign: 'right' }}>{avg.toFixed(2)}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 60, textAlign: 'right', fontFamily: 'Barlow Condensed' }}>
                {vals.length} jogo{vals.length !== 1 ? 's' : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatHighlight({ icon, label, value, sub, gold }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 180, textAlign: 'center', borderColor: gold ? 'rgba(245,200,66,0.25)' : 'var(--border)', background: gold ? 'rgba(245,200,66,0.04)' : 'var(--bg-card)' }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 11, fontFamily: 'Barlow Condensed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: gold ? 'var(--gold)' : 'var(--text-primary)' }}>{value || '—'}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function getRatingColor(val) {
  const n = parseFloat(val);
  if (n >= 7) return 'var(--green)';
  if (n >= 5) return 'var(--gold)';
  return 'var(--red-primary)';
}