'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatMatchDate } from '../../../lib/dateUtils';
import { matchesApi } from '../../../lib/api';
import RatingBadge from '../../../components/RatingBadge';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { ArrowLeft, Star, Target, Zap, Home, Plane } from 'lucide-react';
import { FootballFieldDisplay } from '../../../components/FootballField';

// ── Football pitch inline ─────────────────────────────────────────────────
const FORMATIONS_MAP = {
  '4-4-2':  [['GK'],['RB','CB','CB','LB'],['RM','CM','CM','LM'],['ST','ST']],
  '4-3-3':  [['GK'],['RB','CB','CB','LB'],['CM','CM','CM'],['RW','ST','LW']],
  '4-2-4':  [['GK'],['RB','CB','CB','LB'],['CM','CM'],['RW','ST','ST','LW']],
  '4-1-4-1':[['GK'],['RB','CB','CB','LB'],['CDM'],['RM','CM','CM','LM'],['ST']],
  '4-2-3-1':[['GK'],['RB','CB','CB','LB'],['CDM','CDM'],['RW','CAM','LW'],['ST']],
  '3-5-2':  [['GK'],['CB','CB','CB'],['RWB','CM','CM','CM','LWB'],['ST','ST']],
  '4-2-2-2':[['GK'],['RB','CB','CB','LB'],['CM','CM'],['CAM','CAM'],['ST','ST']],
};

const POSITION_SORT = {'Goleiro':1,'Lateral Direito':2,'Zagueiro':3,'Lateral Esquerdo':4,'Volante':5,'Meia':6,'Atacante':7};
function sortByPos(arr) {
  return [...arr].sort((a,b)=>{
    const pa=POSITION_SORT[a.position_in_match||a.position]??99;
    const pb=POSITION_SORT[b.position_in_match||b.position]??99;
    return pa!==pb?pa-pb:(a.player_name||'').localeCompare(b.player_name||'');
  });
}

function PitchView({ players }) {
  const [formation, setFormation] = useState('4-3-3');
  const lines = [...(FORMATIONS_MAP[formation] || FORMATIONS_MAP['4-3-3'])].reverse();
  const sorted = sortByPos(players);
  let idx = 0;

  return (
    <div style={{marginBottom:28}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14,flexWrap:'wrap'}}>
        <h3 style={{fontFamily:'Bebas Neue',fontSize:26,margin:0}}>
          Campo — <span style={{color:'var(--red-primary)'}}>Escalação</span>
        </h3>
        <select
          className="input"
          style={{width:120}}
          value={formation}
          onChange={e=>setFormation(e.target.value)}
        >
          {Object.keys(FORMATIONS_MAP).map(f=><option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      <div style={{
        position:'relative',width:'100%',maxWidth:400,margin:'0 auto',
        background:'linear-gradient(180deg,#1a4a1a 0%,#1e5a1e 25%,#1a4a1a 50%,#1e5a1e 75%,#1a4a1a 100%)',
        borderRadius:12,border:'3px solid #2d7a2d',overflow:'hidden',
        paddingBottom:'138%',
      }}>
        <svg style={{position:'absolute',inset:0,width:'100%',height:'100%'}} viewBox="0 0 400 552" preserveAspectRatio="xMidYMid meet">
          <rect x="8" y="8" width="384" height="536" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"/>
          <line x1="8" y1="276" x2="392" y2="276" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"/>
          <circle cx="200" cy="276" r="52" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"/>
          <circle cx="200" cy="276" r="2.5" fill="rgba(255,255,255,0.6)"/>
          <rect x="90" y="8"   width="220" height="88"  fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"/>
          <rect x="140" y="8"  width="120" height="48"  fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"/>
          <circle cx="200" cy="76" r="2.5" fill="rgba(255,255,255,0.6)"/>
          <rect x="90" y="456" width="220" height="88"  fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"/>
          <rect x="140" y="496" width="120" height="48" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"/>
          <circle cx="200" cy="476" r="2.5" fill="rgba(255,255,255,0.6)"/>
          <rect x="162" y="3"   width="76" height="10" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
          <rect x="162" y="539" width="76" height="10" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
        </svg>

        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',justifyContent:'space-around',padding:'3% 2%'}}>
          {lines.map((line, li)=>{
            const linePlayers = line.map(()=>sorted[idx++]||null);
            return (
              <div key={li} style={{display:'flex',justifyContent:'space-around',alignItems:'center',flex:1}}>
                {linePlayers.map((pl,si)=>{
                  const hasRating = pl?.average_rating != null;
                  const rColor = hasRating
                    ? (parseFloat(pl.average_rating)>=7?'#00c853':parseFloat(pl.average_rating)>=5?'#f5c842':'#e8001c')
                    : null;
                  return (
                    <Link key={si} href={pl?`/jogadores/${pl.player_id}`:'#'} style={{textDecoration:'none'}}>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,minWidth:52}}>
                        <div style={{
                          width:42,height:42,borderRadius:'50%',overflow:'hidden',
                          background:pl?'var(--red-primary)':'rgba(255,255,255,0.12)',
                          border:pl?`2.5px solid ${rColor||'rgba(255,255,255,0.8)'}`:'2px dashed rgba(255,255,255,0.3)',
                          display:'flex',alignItems:'center',justifyContent:'center',
                          boxShadow:pl?'0 2px 6px rgba(0,0,0,0.5)':'none',
                          position:'relative',
                        }}>
                          {pl?.photo_url
                            ?<img src={pl.photo_url} alt={pl.player_name} style={{width:'100%',height:'100%',objectFit:'cover'}}
                                onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex';}}/>
                            :null}
                          <span style={{display:pl?.photo_url?'none':'flex',alignItems:'center',justifyContent:'center',
                            fontFamily:'Bebas Neue',fontSize:12,color:'white',width:'100%',height:'100%'}}>
                            {pl?.number||line[si]?.slice(0,2)}
                          </span>
                          {/* Rating badge */}
                          {hasRating && (
                            <div style={{
                              position:'absolute',bottom:-6,right:-4,
                              background:rColor,borderRadius:4,padding:'0 4px',
                              fontFamily:'Bebas Neue',fontSize:10,color:'white',
                              boxShadow:'0 1px 4px rgba(0,0,0,0.6)',lineHeight:'16px',
                            }}>{Number(pl.average_rating).toFixed(1)}</div>
                          )}
                        </div>
                        <span style={{
                          fontSize:9,fontFamily:'Barlow Condensed',fontWeight:700,
                          color:'white',textShadow:'0 1px 3px rgba(0,0,0,0.9)',
                          textAlign:'center',maxWidth:52,
                          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                        }}>{pl?.player_name?.split(' ').pop()||line[si]}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function MatchDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    matchesApi.getById(id)
      .then(setData)
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-container" style={{ paddingTop: 40 }}><LoadingSpinner text="Carregando jogo..." /></div>;
  if (!data) return null;

  const { match, players, goals, assists, highlights } = data;
  const flaWon = match.flamengo_goals > match.opponent_goals;
  const drew   = match.flamengo_goals === match.opponent_goals;
  const resultColor = flaWon ? 'var(--green)' : drew ? 'var(--gold)' : 'var(--red-primary)';
  const resultLabel = flaWon ? 'VITÓRIA' : drew ? 'EMPATE' : 'DERROTA';

  // Craque e bagre — calculados uma vez aqui, fora do map
  const rated        = players.filter(p => p.average_rating !== null);
  const worstRating  = rated.length ? Math.min(...rated.map(p => parseFloat(p.average_rating))) : null;
  const bestRating   = rated.length ? Math.max(...rated.map(p => parseFloat(p.average_rating))) : null;
  const bagreIds     = new Set(worstRating !== null ? rated.filter(p => parseFloat(p.average_rating) === worstRating).map(p => p.player_id) : []);
  const craqueIds    = new Set(bestRating  !== null ? rated.filter(p => parseFloat(p.average_rating) === bestRating ).map(p => p.player_id) : []);
  const craqueNames  = rated.filter(p => craqueIds.has(p.player_id)).map(p => p.player_name);

  return (
    <div className="page-container fade-in" style={{ paddingTop: 32, paddingBottom: 80 }}>
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, marginBottom: 24, fontFamily: 'Barlow Condensed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <ArrowLeft size={16} /> Todos os jogos
      </Link>

      {/* Match header card */}
      <div className="card" style={{ marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: resultColor }} />

        {/* Date | Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {formatMatchDate(match.match_date, "EEEE, dd 'de' MMMM 'de' yyyy")}
            {match.stadium && ` • ${match.stadium}`}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge badge-red">{match.championship}</span>
            {match.round && <span className="badge badge-gray">{match.round}</span>}
            <span className="badge" style={{ background: `${resultColor}20`, color: resultColor, border: `1px solid ${resultColor}40` }}>{resultLabel}</span>
            <span className="badge badge-gray">{match.is_home ? <><Home size={10} /> Casa</> : <><Plane size={10} /> Fora</>}</span>
          </div>
        </div>

        {/* Score */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, padding: '8px 0 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logos/flamengo.png" alt="Flamengo" style={{ width: 52, height: 52, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
            </div>
            <span style={{ fontFamily: 'Bebas Neue', fontSize: 20 }}>Flamengo</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 72, letterSpacing: '0.05em', color: resultColor, lineHeight: 1 }}>
              {match.flamengo_goals} <span style={{ color: 'var(--text-muted)', fontSize: 40 }}>×</span> {match.opponent_goals}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {match.opponent_logo && <img src={match.opponent_logo} alt={match.opponent_name} style={{ width: 52, height: 52, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />}
              <span style={{ display: match.opponent_logo ? 'none' : 'block', fontFamily: 'Bebas Neue', fontSize: 16, color: 'var(--text-muted)' }}>{match.opponent_short || '?'}</span>
            </div>
            <span style={{ fontFamily: 'Bebas Neue', fontSize: 20 }}>{match.opponent_name}</span>
          </div>
        </div>

        {/* 4 highlight cards */}
        {highlights && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {/* Craque(s) */}
            <div style={{ background: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.2)', borderRadius: 10, padding: '16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, textAlign: 'center', minHeight: 110 }}>
              <Star size={18} color="var(--gold)" fill="var(--gold)" />
              <div style={{ fontSize: 10, fontFamily: 'Barlow Condensed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)' }}>Craque{craqueNames.length > 1 ? 's' : ''} do Jogo</div>
              {craqueNames.length > 0
                ? craqueNames.map(n => <div key={n} style={{ fontFamily: 'Bebas Neue', fontSize: craqueNames.length > 1 ? 14 : 18, lineHeight: 1.15 }}>{n}</div>)
                : <div style={{ fontFamily: 'Bebas Neue', fontSize: 18 }}>—</div>}
              {bestRating !== null && craqueNames.length > 0 && (
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: 'var(--gold)' }}>{Number(bestRating).toFixed(1)}</div>
              )}
            </div>
            {/* Média do time */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center', minHeight: 110 }}>
              <span style={{ fontSize: 18 }}>⚽</span>
              <div style={{ fontSize: 10, fontFamily: 'Barlow Condensed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Média do Time</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 36, color: getRatingColor(highlights.team_avg), lineHeight: 1 }}>
                {highlights.team_avg > 0 ? Number(highlights.team_avg).toFixed(2) : '—'}
              </div>
            </div>
            {/* Simões */}
            <div style={{ background: 'rgba(232,0,28,0.05)', border: '1px solid rgba(232,0,28,0.15)', borderRadius: 10, padding: '16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center', minHeight: 110 }}>
              <span style={{ fontSize: 18 }}>🎤</span>
              <div style={{ fontSize: 10, fontFamily: 'Barlow Condensed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--red-primary)' }}>Simões</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 36, color: getRatingColor(highlights.simoes_avg), lineHeight: 1 }}>
                {highlights.simoes_avg > 0 ? Number(highlights.simoes_avg).toFixed(2) : '—'}
              </div>
            </div>
            {/* Bruninho */}
            <div style={{ background: 'rgba(68,138,255,0.05)', border: '1px solid rgba(68,138,255,0.15)', borderRadius: 10, padding: '16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center', minHeight: 110 }}>
              <span style={{ fontSize: 18 }}>🎙️</span>
              <div style={{ fontSize: 10, fontFamily: 'Barlow Condensed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--blue)' }}>Bruninho</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 36, color: getRatingColor(highlights.bruninho_avg), lineHeight: 1 }}>
                {highlights.bruninho_avg > 0 ? Number(highlights.bruninho_avg).toFixed(2) : '—'}
              </div>
            </div>
          </div>
        )}

        {/* Goals & Assists */}
        {(goals?.length > 0 || assists?.length > 0) && (
          <div style={{ display: 'flex', gap: 24, marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            {goals?.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--text-muted)' }}>
                  <Target size={14} />
                  <span style={{ fontFamily: 'Barlow Condensed', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gols</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {goals.map(g => <span key={g.id} className="badge badge-green">{g.player_name || 'Gol contra'}{g.minute && ` ${g.minute}'`}{g.is_penalty && ' (P)'}</span>)}
                </div>
              </div>
            )}
            {assists?.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--text-muted)' }}>
                  <Zap size={14} />
                  <span style={{ fontFamily: 'Barlow Condensed', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Assistências</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {assists.map(a => <span key={a.id} className="badge badge-blue">{a.player_name}{a.minute && ` ${a.minute}'`}</span>)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Football pitch */}
      {players.length > 0 && <PitchView players={players} />}

      {/* Football field */}
      {players.length > 0 && match.formation && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 32, marginBottom: 16 }}>
            Escalação <span style={{ color: 'var(--red-primary)' }}>{match.formation}</span>
          </h2>
          <FootballFieldDisplay
            formation={match.formation}
            starters={players.map(p => ({
              player_id: p.player_id,
              name: p.player_name,
              number: p.number,
              position: p.position_in_match || p.position,
            }))}
          />
        </div>
      )}

      {/* Players table */}
      <h2 style={{ fontSize: 32, marginBottom: 20 }}>Notas dos <span style={{ color: 'var(--red-primary)' }}>Titulares</span></h2>
      {players.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Escalação e notas ainda não foram cadastradas para este jogo.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px', padding: '8px 16px', gap: 8 }}>
            {['Jogador', 'Simões', 'Bruninho', 'Média'].map(h => (
              <span key={h} style={{ fontSize: 11, fontFamily: 'Barlow Condensed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', textAlign: h === 'Jogador' ? 'left' : 'center' }}>{h}</span>
            ))}
          </div>
          {players.map(player => {
            // Computed per-row using pre-built Sets
            const isBagre  = bagreIds.has(player.player_id);
            const isCraque = craqueIds.has(player.player_id);
            return (
              <Link key={player.player_id} href={`/jogadores/${player.player_id}`}>
                <div className="card" style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {player.photo_url
                          ? <img src={player.photo_url} alt={player.player_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                          : null}
                        <span style={{ display: player.photo_url ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontFamily: 'Bebas Neue', fontSize: 14, color: 'var(--text-muted)' }}>{player.number || '#'}</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{player.player_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed', letterSpacing: '0.04em' }}>{player.position_in_match || player.position}</div>
                      </div>
                      {isCraque && <span className="badge badge-gold" style={{ marginLeft: 4 }}>⭐ Craque</span>}
                      {isBagre && !isCraque && <span className="badge badge-red" style={{ marginLeft: 4 }}>🐟 Bagre</span>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}><RatingBadge value={player.simoes_rating} size="sm" /></div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}><RatingBadge value={player.bruninho_rating} size="sm" /></div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}><RatingBadge value={player.average_rating} size="sm" /></div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getRatingColor(val) {
  const n = parseFloat(val);
  if (n >= 7) return 'var(--green)';
  if (n >= 5) return 'var(--gold)';
  return 'var(--red-primary)';
}