'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ratingsApi, matchesApi } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { BarChart3, Trophy, Users, Filter } from 'lucide-react';

export default function StatisticsPage() {
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [season, setSeason]         = useState(String(new Date().getFullYear()));
  const [seasons, setSeasons]       = useState([String(new Date().getFullYear())]);
  const [championships, setChampionships] = useState([]);
  const [filterChamp, setFilterChamp]     = useState('');  // '' = todos
  const [tab, setTab]               = useState('ranking');

  useEffect(() => {
    matchesApi.getSeasons().then(s => { if (s.length) setSeasons(s.map(String)); }).catch(() => {});
    matchesApi.getChampionships().then(setChampionships).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    ratingsApi.getStats({ season }).then(setStats).finally(() => setLoading(false));
  }, [season]);

  const tabs = [
    { id: 'ranking',    label: 'Ranking Geral',      icon: Trophy    },
    { id: 'porcamp',    label: 'Por Campeonato',      icon: Filter    },
    { id: 'bvs',        label: 'Bruninho vs Simões',  icon: Users     },
    { id: 'evolution',  label: 'Evolução',            icon: BarChart3 },
  ];

  // Championship filter helper
  const filterByChamp = (games) =>
    filterChamp ? games.filter(g => g.championship === filterChamp) : games;

  return (
    <div className="page-container fade-in" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <BarChart3 size={28} color="var(--red-primary)" />
        <h1 style={{ fontSize: 48 }}>Estatísticas</h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>Análise completa das notas por temporada.</p>

      {/* Season + championship filters */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 160 }}>
          <label>Temporada</label>
          <select className="input" value={season} onChange={e => setSeason(e.target.value)}>
            {seasons.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {(tab === 'porcamp' || tab === 'evolution') && (
          <div style={{ minWidth: 200 }}>
            <label>Campeonato</label>
            <select className="input" value={filterChamp} onChange={e => setFilterChamp(e.target.value)}>
              <option value="">Todos os campeonatos</option>
              {championships.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
            padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 13,
            letterSpacing: '0.05em', textTransform: 'uppercase',
            color: tab === id ? 'var(--red-primary)' : 'var(--text-muted)',
            borderBottom: tab === id ? '2px solid var(--red-primary)' : '2px solid transparent',
            marginBottom: -1, transition: 'all 0.2s', flexShrink: 0,
          }}>
            <Icon size={14} />{label}
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
          {/* ── RANKING GERAL ── */}
          {tab === 'ranking' && (
            <RankingTable ranking={stats.ranking} showMinNote={true} totalMatches={stats.total_matches} />
          )}

          {/* ── POR CAMPEONATO ── */}
          {tab === 'porcamp' && (
            <ChampionshipTab byChampionship={stats.by_championship} filterChamp={filterChamp} />
          )}

          {/* ── BRUNINHO VS SIMÕES ── */}
          {tab === 'bvs' && stats.bruninho_vs_simoes && (
            <BvsTab bvs={stats.bruninho_vs_simoes} />
          )}

          {/* ── EVOLUÇÃO ── */}
          {tab === 'evolution' && (
            <EvolutionTab matchEvolution={(stats.match_evolution || []).filter(m => !filterChamp || m.championship === filterChamp)} season={season} />
          )}
        </>
      )}
    </div>
  );
}

// ─── Ranking table ────────────────────────────────────────────────────────────
function RankingTable({ ranking, showMinNote = true, totalMatches }) {
  if (!ranking || ranking.length === 0) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Nenhuma nota registrada.</div>;
  }
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
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatHighlight icon="⭐" label="Melhor Jogador"    value={ranking[0]?.name} sub={ranking[0]?.avg_overall ? `Média ${Number(ranking[0].avg_overall).toFixed(2)}` : ''} gold />
        <StatHighlight icon="🐟" label="Bagre da Temporada" value={ranking[ranking.length - 1]?.name} sub={ranking[ranking.length - 1]?.avg_overall ? `Média ${Number(ranking[ranking.length - 1].avg_overall).toFixed(2)}` : ''} />
        <StatHighlight icon="⚽" label="Jogos Avaliados" value={totalMatches != null ? `${totalMatches} jogo${totalMatches !== 1 ? 's' : ''}` : '—'} />
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              {cols.map(c => <th key={c.key} style={thS(c)}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {ranking.map((player, i) => (
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
      </div>
      {showMinNote && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed', marginTop: 10 }}>
          * Apenas jogadores com 3 ou mais jogos como titular.
        </p>
      )}
    </div>
  );
}

// ─── Por campeonato ───────────────────────────────────────────────────────────
function ChampionshipTab({ byChampionship, filterChamp }) {
  const grouped = (byChampionship || []).reduce((acc, row) => {
    if (filterChamp && row.championship !== filterChamp) return acc;
    if (!acc[row.championship]) acc[row.championship] = [];
    acc[row.championship].push(row);
    return acc;
  }, {});

  const entries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Nenhum dado para este filtro.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      {entries.map(([champ, players]) => {
        const sorted = [...players].sort((a, b) => parseFloat(b.avg_overall) - parseFloat(a.avg_overall));
        const best  = sorted[0];
        const worst = sorted[sorted.length - 1];
        const totalJogos = sorted.length > 0 ? (parseInt(sorted[0]?.match_count) || Math.max(...sorted.map(p => parseInt(p.games) || 0))) : 0;

        return (
          <div key={champ}>
            {/* Championship header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: 'var(--text-primary)' }}>{champ}</h3>
              <span style={{ fontFamily: 'Barlow Condensed', fontSize: 13, color: 'var(--text-muted)' }}>
                {players.length} jogadores avaliados
              </span>
            </div>

            {/* Highlights row */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <StatHighlight icon="⭐" label="Melhor" value={best?.name}  sub={best?.avg_overall  ? `Média ${Number(best.avg_overall).toFixed(2)}`  : ''} gold />
              <StatHighlight icon="🐟" label="Pior"   value={worst?.name} sub={worst?.avg_overall ? `Média ${Number(worst.avg_overall).toFixed(2)}` : ''} />
              <StatHighlight icon="⚽" label="Total de Jogos" value={`${totalJogos} jogo${totalJogos !== 1 ? 's' : ''}`} />
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    {[
                      ['#',       'center', 48 ],
                      ['Jogador', 'left',   220],
                      ['Pos.',    'left',   110],
                      ['Jogos',   'left',   70 ],
                      ['Bruninho','left',   90 ],
                      ['Simões',  'left',   90 ],
                      ['Média',   'left',   90 ],
                    ].map(([l, a, w]) => (
                      <th key={l} style={{ padding: '10px 14px', textAlign: a, width: w, fontSize: 11, fontFamily: 'Barlow Condensed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((p, i) => (
                    <tr key={`${p.id}-${i}`} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
                    >
                      {/* # */}
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontFamily: 'Bebas Neue', fontSize: 16, color: i < 3 ? 'var(--gold)' : 'var(--text-muted)' }}>{i + 1}</td>
                      {/* Jogador com foto */}
                      <td style={{ padding: '10px 14px' }}>
                        <Link href={`/jogadores/${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)' }}>
                          {p.photo_url
                            ? <img src={p.photo_url} alt={p.name} style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }}
                                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                            : null}
                          <div style={{ display: p.photo_url ? 'none' : 'flex', width: 32, height: 32, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                            {p.name?.slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                        </Link>
                      </td>
                      {/* Pos */}
                      <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 11, fontFamily: 'Barlow Condensed', color: 'var(--text-muted)' }}>{p.position}</span></td>
                      {/* Jogos */}
                      <td style={{ padding: '10px 14px', fontFamily: 'Barlow Condensed', fontWeight: 600 }}>{p.games}</td>
                      {/* Bruninho */}
                      <td style={{ padding: '10px 14px' }}><span style={{ fontFamily: 'Barlow Condensed', fontWeight: 600, color: getRatingColor(p.avg_bruninho) }}>{p.avg_bruninho ? Number(p.avg_bruninho).toFixed(2) : '—'}</span></td>
                      {/* Simões */}
                      <td style={{ padding: '10px 14px' }}><span style={{ fontFamily: 'Barlow Condensed', fontWeight: 600, color: getRatingColor(p.avg_simoes) }}>{p.avg_simoes ? Number(p.avg_simoes).toFixed(2) : '—'}</span></td>
                      {/* Média */}
                      <td style={{ padding: '10px 14px' }}><span style={{ fontFamily: 'Bebas Neue', fontSize: 20, color: getRatingColor(p.avg_overall) }}>{p.avg_overall ? Number(p.avg_overall).toFixed(2) : '—'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Bruninho vs Simões ───────────────────────────────────────────────────────
function BvsTab({ bvs }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 640, margin: '0 auto' }}>
        {/* Bruninho */}
        <div className="card" style={{ textAlign: 'center', borderColor: 'rgba(68,138,255,0.25)', background: 'rgba(68,138,255,0.04)' }}>
          {/* Photo */}
          <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 12px', border: '2px solid rgba(68,138,255,0.4)', background: 'var(--bg-secondary)' }}>
            <img src="/bruninho.png" alt="Bruninho" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
            <span style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: 28 }}>🎙️</span>
          </div>
          <h3 style={{ fontSize: 32, color: 'var(--blue)', marginBottom: 4 }}>Bruninho</h3>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 56, color: 'var(--blue)', lineHeight: 1 }}>
            {Number(bvs.avg_bruninho).toFixed(2)}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Média geral</div>
          <div style={{ marginTop: 16, padding: '12px', background: 'rgba(68,138,255,0.08)', borderRadius: 8 }}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 28 }}>{bvs.bruninho_higher}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed' }}>vezes deu nota MAIOR</div>
          </div>
        </div>
        {/* Simões */}
        <div className="card" style={{ textAlign: 'center', borderColor: 'rgba(232,0,28,0.25)', background: 'rgba(232,0,28,0.04)' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 12px', border: '2px solid rgba(232,0,28,0.4)', background: 'var(--bg-secondary)' }}>
            <img src="/simoes.png" alt="Simões" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
            <span style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: 28 }}>🎤</span>
          </div>
          <h3 style={{ fontSize: 32, color: 'var(--red-primary)', marginBottom: 4 }}>Simões</h3>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 56, color: 'var(--red-primary)', lineHeight: 1 }}>
            {Number(bvs.avg_simoes).toFixed(2)}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Média geral</div>
          <div style={{ marginTop: 16, padding: '12px', background: 'rgba(232,0,28,0.08)', borderRadius: 8 }}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 28 }}>{bvs.simoes_higher}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed' }}>vezes deu nota MAIOR</div>
          </div>
        </div>
      </div>
      <div className="card" style={{ textAlign: 'center', marginTop: 20, maxWidth: 640, margin: '20px auto 0' }}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, color: 'var(--gold)' }}>Empates: {bvs.equal}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed' }}>vezes deram a mesma nota</div>
      </div>
    </div>
  );
}

// ─── Evolução (gráfico por mês) ───────────────────────────────────────────────
function MonthChart({ games, monthLabel }) {
  if (!games || games.length === 0) return null;
  const W = 900, H = 300;
  const PAD = { top: 44, right: 32, bottom: 80, left: 48 };
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
        {monthLabel}
        <span style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed', marginLeft: 10 }}>
          {games.length} jogo{games.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: Math.max(400, games.length * 80), height: 'auto', display: 'block' }}>
          <defs>
            <linearGradient id={`grad-${monthLabel.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
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
          <path d={fillPath} fill={`url(#grad-${monthLabel.replace(/\s/g, '')})`} />
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
            return (
              <g key={m.match_id || i}>
                <circle cx={x} cy={y} r="6" fill={color} stroke="#0a0a0f" strokeWidth="2" />
                <text x={x} y={y - 14} textAnchor="middle" fill={color} fontFamily="Bebas Neue" fontSize="15" letterSpacing="0.03em">{rating.toFixed(1)}</text>
                <text x={x} y={PAD.top + chartH + 18} textAnchor="middle" fill="#9090a8" fontFamily="Barlow Condensed" fontSize="12" fontWeight="600">{dateStr}</text>
                {logoUrl
                  ? <image href={logoUrl} x={x - logoSize / 2} y={logoY} width={logoSize} height={logoSize} preserveAspectRatio="xMidYMid meet" />
                  : <text x={x} y={logoY + 16} textAnchor="middle" fill="#5a5a72" fontFamily="Barlow Condensed" fontSize="12" fontWeight="600">
                      {(m.opponent_name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3)}
                    </text>
                }
                <text x={x} y={PAD.top + chartH + 72} textAnchor="middle" fill="#5a5a72" fontFamily="Bebas Neue" fontSize="12">{m.flamengo_goals}×{m.opponent_goals}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function EvolutionTab({ matchEvolution, season }) {
  if (!matchEvolution || matchEvolution.length === 0) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Sem dados suficientes.</div>;
  }
  const byMonth = matchEvolution.reduce((acc, m) => {
    const key = String(m.match_date).slice(0, 7);
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});
  return (
    <div>
      <h3 style={{ fontSize: 24, marginBottom: 20, color: 'var(--text-secondary)', fontFamily: 'Bebas Neue', letterSpacing: '0.04em' }}>
        Evolução por Jogo — {season}
      </h3>
      {Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([key, games]) => {
        const [y, mo] = key.split('-');
        const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        return <MonthChart key={key} games={games} monthLabel={label} />;
      })}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatHighlight({ icon, label, value, sub, gold }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 160, textAlign: 'center', borderColor: gold ? 'rgba(245,200,66,0.25)' : 'var(--border)', background: gold ? 'rgba(245,200,66,0.04)' : 'var(--bg-card)' }}>
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