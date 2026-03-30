'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ratingsApi, matchesApi } from '../../lib/api';
import RatingBadge from '../../components/RatingBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { BarChart3, Trophy, TrendingDown, Users } from 'lucide-react';

export default function StatisticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState(String(new Date().getFullYear()));
  const [seasons, setSeasons] = useState([String(new Date().getFullYear())]);
  const [tab, setTab] = useState('ranking');

  useEffect(() => {
    matchesApi.getSeasons().then(s => {
      if (s.length) setSeasons(s.map(String));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    ratingsApi.getStats({ season })
      .then(setStats)
      .finally(() => setLoading(false));
  }, [season]);

  const tabs = [
    { id: 'ranking', label: 'Ranking Geral', icon: Trophy },
    { id: 'bvs', label: 'Bruninho vs Simões', icon: Users },
    { id: 'evolution', label: 'Evolução Mensal', icon: BarChart3 },
  ];

  return (
    <div className="page-container fade-in" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <BarChart3 size={28} color="var(--red-primary)" />
        <h1 style={{ fontSize: 48 }}>Estatísticas</h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
      Análise completa das notas por temporada.
    </p>

      {/* Season selector */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 160 }}>
          <label>Temporada</label>
          <select className="input" value={season} onChange={e => setSeason(e.target.value)}>
            {seasons.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
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
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'ranking' && (
      <p style={{
        fontSize: 12,
        color: 'var(--text-muted)',
        fontFamily: 'Barlow Condensed',
        letterSpacing: '0.04em',
        marginBottom: 16
      }}>
        * No ranking geral aparecem apenas jogadores com 3 ou mais jogos como titular.
      </p>
    )}
      {loading ? <LoadingSpinner text="Calculando estatísticas..." /> : !stats ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Sem dados para esta temporada.</div>
      ) : (
        <>
          {/* RANKING TAB */}
          {tab === 'ranking' && (
            <div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <StatHighlight icon="⭐" label="Melhor Jogador" value={stats.ranking[0]?.name} sub={stats.ranking[0]?.avg_overall ? `Média ${Number(stats.ranking[0].avg_overall).toFixed(2)}` : ''} gold />
                <StatHighlight icon="🐟" label="Bagre da Temporada" value={stats.ranking[stats.ranking.length - 1]?.name} sub={stats.ranking[stats.ranking.length - 1]?.avg_overall ? `Média ${Number(stats.ranking[stats.ranking.length - 1].avg_overall).toFixed(2)}` : ''} />
                <StatHighlight icon="⚽" label="Jogos Avaliados" value={stats.ranking[0]?.games ? `${Math.max(...stats.ranking.map(r => r.games || 0))} jogos` : '—'} />
              </div>

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Column config: key, label, align, width */}
                {(() => {
                  const cols = [
                    { key: '#',       label: '#',        align: 'center', w: 48  },
                    { key: 'jogador', label: 'Jogador',  align: 'left',   w: 220 },
                    { key: 'pos',     label: 'Pos.',     align: 'left',   w: 110 },
                    { key: 'jogos',   label: 'Jogos',    align: 'left',   w: 70  },
                    { key: 'bru',     label: 'Bruninho', align: 'left',   w: 90  },
                    { key: 'sim',     label: 'Simões',   align: 'left',   w: 90  },
                    { key: 'med',     label: 'Média',    align: 'left',   w: 90  },
                    { key: 'mel',     label: 'Melhor',   align: 'left',   w: 80  },
                    { key: 'cra',     label: 'Craques',  align: 'left',   w: 80  },
                    { key: 'bag',     label: 'Bagres',   align: 'left',   w: 70  },
                  ];
                  const thS = (col) => ({
                    padding: '12px 16px', textAlign: col.align, width: col.w,
                    fontSize: 11, fontFamily: 'Barlow Condensed', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)',
                    borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
                  });
                  const tdS = (col, extra = {}) => ({
                    padding: '12px 16px', textAlign: col.align, ...extra,
                  });
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
                            {/* # */}
                            <td style={tdS(cols[0], { fontFamily: 'Bebas Neue', fontSize: 18, color: i < 3 ? 'var(--gold)' : 'var(--text-muted)' })}>{i + 1}</td>
                            {/* Jogador */}
                            <td style={tdS(cols[1])}>
                              <Link href={`/jogadores/${player.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)' }}>
                                {player.photo_url ? (
                                  <img src={player.photo_url} alt={player.name} style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }}
                                    onError={e => { e.target.style.display = 'none'; }} />
                                ) : (
                                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                                    {player.name?.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.name}</span>
                              </Link>
                            </td>
                            {/* Pos */}
                            <td style={tdS(cols[2])}><span style={{ fontSize: 11, fontFamily: 'Barlow Condensed', color: 'var(--text-muted)' }}>{player.position}</span></td>
                            {/* Jogos */}
                            <td style={tdS(cols[3], { fontFamily: 'Barlow Condensed', fontWeight: 600 })}>{player.games}</td>
                            {/* Bruninho */}
                            <td style={tdS(cols[4])}><span style={{ fontFamily: 'Barlow Condensed', fontWeight: 600, color: getRatingColor(player.avg_bruninho) }}>{player.avg_bruninho ? Number(player.avg_bruninho).toFixed(2) : '—'}</span></td>
                            {/* Simões */}
                            <td style={tdS(cols[5])}><span style={{ fontFamily: 'Barlow Condensed', fontWeight: 600, color: getRatingColor(player.avg_simoes) }}>{player.avg_simoes ? Number(player.avg_simoes).toFixed(2) : '—'}</span></td>
                            {/* Média */}
                            <td style={tdS(cols[6])}><span style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: getRatingColor(player.avg_overall) }}>{player.avg_overall ? Number(player.avg_overall).toFixed(2) : '—'}</span></td>
                            {/* Melhor */}
                            <td style={tdS(cols[7])}><span style={{ color: 'var(--green)', fontFamily: 'Barlow Condensed', fontWeight: 600 }}>{player.best_game ? Number(player.best_game).toFixed(1) : '—'}</span></td>
                            {/* Craques */}
                            <td style={tdS(cols[8])}><span style={{ color: 'var(--gold)', fontFamily: 'Barlow Condensed', fontWeight: 700 }}>{player.craque_count || 0}</span></td>
                            {/* Bagres */}
                            <td style={tdS(cols[9])}><span style={{ color: 'var(--red-primary)', fontFamily: 'Barlow Condensed', fontWeight: 700 }}>{player.bagre_count || 0}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
                {stats.ranking.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    Nenhuma nota registrada nesta temporada.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BRUNINHO VS SIMÕES TAB */}
          {tab === 'bvs' && stats.bruninho_vs_simoes && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 600, margin: '0 auto' }}>
                <div className="card" style={{ textAlign: 'center', borderColor: 'rgba(68,138,255,0.25)', background: 'rgba(68,138,255,0.04)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎙️</div>
                  <h3 style={{ fontSize: 32, color: 'var(--blue)', marginBottom: 4 }}>Bruninho</h3>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 56, color: 'var(--blue)', lineHeight: 1 }}>
                    {Number(stats.bruninho_vs_simoes.avg_bruninho).toFixed(2)}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Média geral</div>
                  <div style={{ marginTop: 16, padding: '12px', background: 'rgba(68,138,255,0.08)', borderRadius: 8 }}>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: 28 }}>{stats.bruninho_vs_simoes.bruninho_higher}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed' }}>vezes deu nota MAIOR</div>
                  </div>
                </div>
                <div className="card" style={{ textAlign: 'center', borderColor: 'rgba(232,0,28,0.25)', background: 'rgba(232,0,28,0.04)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎤</div>
                  <h3 style={{ fontSize: 32, color: 'var(--red-primary)', marginBottom: 4 }}>Simões</h3>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 56, color: 'var(--red-primary)', lineHeight: 1 }}>
                    {Number(stats.bruninho_vs_simoes.avg_simoes).toFixed(2)}
                  </div>
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

          {/* MONTHLY EVOLUTION TAB */}
          {tab === 'evolution' && (
            <div>
              <h3 style={{ fontSize: 24, marginBottom: 20, color: 'var(--text-secondary)' }}>
                Média do time por mês — {season}
              </h3>
              {stats.monthly_evolution?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Sem dados suficientes.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(stats.monthly_evolution || []).map(m => {
                    const [year, month] = m.month.split('-');
                    const monthName = new Date(year, parseInt(month) - 1).toLocaleString('pt-BR', { month: 'long' });
                    const pct = (m.avg_rating / 10) * 100;
                    return (
                      <div key={m.month} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 100, fontFamily: 'Barlow Condensed', fontWeight: 600, textTransform: 'capitalize', fontSize: 15 }}>
                          {monthName}
                        </div>
                        <div style={{ flex: 1, height: 12, background: 'var(--bg-secondary)', borderRadius: 6, overflow: 'hidden' }}>
                          <div style={{
                            width: `${pct}%`, height: '100%', borderRadius: 6,
                            background: `linear-gradient(90deg, ${getRatingColor(m.avg_rating)}, ${getRatingColor(m.avg_rating)}88)`,
                            transition: 'width 0.6s ease',
                          }} />
                        </div>
                        <div style={{ width: 60, textAlign: 'right' }}>
                          <span style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: getRatingColor(m.avg_rating) }}>
                            {Number(m.avg_rating).toFixed(2)}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', width: 60, textAlign: 'right', fontFamily: 'Barlow Condensed' }}>
                          {m.games_count} jogo{m.games_count > 1 ? 's' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatHighlight({ icon, label, value, sub, gold }) {
  return (
    <div className="card" style={{
      flex: 1, minWidth: 180, textAlign: 'center',
      borderColor: gold ? 'rgba(245,200,66,0.25)' : 'var(--border)',
      background: gold ? 'rgba(245,200,66,0.04)' : 'var(--bg-card)',
    }}>
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