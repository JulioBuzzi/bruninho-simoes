'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { matchesApi } from '../../../lib/api';
import RatingBadge from '../../../components/RatingBadge';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { ArrowLeft, Star, TrendingDown, Target, Zap, Home, Plane, Trophy } from 'lucide-react';

const POSITION_ORDER = ['Goleiro', 'Zagueiro', 'Lateral Direito', 'Lateral Esquerdo', 'Volante', 'Meia', 'Atacante'];

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
  const matchDate = new Date(match.match_date + 'T12:00:00');
  const flaWon = match.flamengo_goals > match.opponent_goals;
  const drew = match.flamengo_goals === match.opponent_goals;
  const resultColor = flaWon ? 'var(--green)' : drew ? 'var(--gold)' : 'var(--red-primary)';
  const resultLabel = flaWon ? 'VITÓRIA' : drew ? 'EMPATE' : 'DERROTA';

  // Group players by position
  const grouped = POSITION_ORDER.reduce((acc, pos) => {
    const group = players.filter(p => (p.position_in_match || p.position) === pos || (p.position || '').includes(pos.split(' ')[0]));
    if (group.length) acc[pos] = group;
    return acc;
  }, {});
  // Any unmatched
  const ungrouped = players.filter(p => !Object.values(grouped).flat().find(gp => gp.player_id === p.player_id));
  if (ungrouped.length) grouped['Outros'] = ungrouped;

  return (
    <div className="page-container fade-in" style={{ paddingTop: 32, paddingBottom: 80 }}>
      {/* Back */}
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, marginBottom: 24, fontFamily: 'Barlow Condensed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <ArrowLeft size={16} /> Todos os jogos
      </Link>

      {/* Match header */}
      <div className="card" style={{ marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: resultColor,
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span className="badge badge-red">{match.championship}</span>
              {match.round && <span className="badge badge-gray">{match.round}</span>}
              <span className="badge" style={{
                background: `${resultColor}20`, color: resultColor, border: `1px solid ${resultColor}40`,
              }}>{resultLabel}</span>
              <span className="badge badge-gray">
                {match.is_home ? <><Home size={10} /> Casa</> : <><Plane size={10} /> Fora</>}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {format(matchDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              {match.stadium && ` • ${match.stadium}`}
            </div>
          </div>
        </div>

        {/* Score */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, padding: '16px 0' }}>
          {/* Flamengo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 12,
              background: 'rgba(232,0,28,0.1)', border: '2px solid rgba(232,0,28,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Bebas Neue', fontSize: 18, color: 'var(--red-primary)',
            }}>CRF</div>
            <span style={{ fontFamily: 'Bebas Neue', fontSize: 20 }}>Flamengo</span>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'Bebas Neue', fontSize: 72, letterSpacing: '0.05em',
              color: resultColor, lineHeight: 1,
            }}>
              {match.flamengo_goals} <span style={{ color: 'var(--text-muted)', fontSize: 40 }}>×</span> {match.opponent_goals}
            </div>
          </div>

          {/* Opponent */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            {match.opponent_logo ? (
              <div style={{ width: 64, height: 64, position: 'relative' }}>
                <Image src={match.opponent_logo} alt={match.opponent_name} fill style={{ objectFit: 'contain' }} unoptimized />
              </div>
            ) : (
              <div style={{
                width: 64, height: 64, borderRadius: 12,
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Bebas Neue', fontSize: 16, color: 'var(--text-muted)',
              }}>{match.opponent_short || '?'}</div>
            )}
            <span style={{ fontFamily: 'Bebas Neue', fontSize: 20 }}>{match.opponent_name}</span>
          </div>
        </div>

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
                  {goals.map(g => (
                    <span key={g.id} className="badge badge-green">
                      {g.player_name || 'Gol contra'} {g.minute && `${g.minute}'`}
                      {g.is_penalty && ' (P)'}
                    </span>
                  ))}
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
                  {assists.map(a => (
                    <span key={a.id} className="badge badge-blue">
                      {a.player_name} {a.minute && `${a.minute}'`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Highlights */}
      {highlights && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
          {highlights.mvp && (
            <div className="card" style={{ textAlign: 'center', borderColor: 'rgba(245,200,66,0.25)', background: 'rgba(245,200,66,0.04)' }}>
              <Star size={20} color="var(--gold)" fill="var(--gold)" style={{ marginBottom: 6 }} />
              <div style={{ fontSize: 11, fontFamily: 'Barlow Condensed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gold)', marginBottom: 4 }}>MVP do Jogo</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 18 }}>{highlights.mvp.player_name}</div>
              <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600 }}>{Number(highlights.mvp.average_rating).toFixed(1)}</div>
            </div>
          )}
          {highlights.bagre && (
            <div className="card" style={{ textAlign: 'center', borderColor: 'rgba(232,0,28,0.2)' }}>
              <TrendingDown size={20} color="var(--red-primary)" style={{ marginBottom: 6 }} />
              <div style={{ fontSize: 11, fontFamily: 'Barlow Condensed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--red-primary)', marginBottom: 4 }}>Bagre do Jogo</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 18 }}>{highlights.bagre.player_name}</div>
              <div style={{ fontSize: 13, color: 'var(--red-primary)', fontWeight: 600 }}>{Number(highlights.bagre.average_rating).toFixed(1)}</div>
            </div>
          )}
          {highlights.team_avg > 0 && (
            <div className="card" style={{ textAlign: 'center' }}>
              <Trophy size={20} color="var(--text-secondary)" style={{ marginBottom: 6 }} />
              <div style={{ fontSize: 11, fontFamily: 'Barlow Condensed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>Média do Time</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 32, color: getRatingColor(highlights.team_avg) }}>
                {Number(highlights.team_avg).toFixed(2)}
              </div>
            </div>
          )}
          {highlights.bruninho_avg > 0 && (
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>🎙️</div>
              <div style={{ fontSize: 11, fontFamily: 'Barlow Condensed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 2 }}>Bruninho</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 26 }}>{Number(highlights.bruninho_avg).toFixed(2)}</div>
              <div style={{ fontSize: 11, fontFamily: 'Barlow Condensed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 2, marginTop: 8 }}>Simões</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 26 }}>{Number(highlights.simoes_avg).toFixed(2)}</div>
            </div>
          )}
        </div>
      )}

      {/* Players ratings */}
      <div>
        <h2 style={{ fontSize: 32, marginBottom: 20 }}>
          Notas dos <span style={{ color: 'var(--red-primary)' }}>Titulares</span>
        </h2>

        {players.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
            Escalação e notas ainda não foram cadastradas para este jogo.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px',
              padding: '8px 16px', gap: 8,
            }}>
              <span style={{ fontSize: 11, fontFamily: 'Barlow Condensed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Jogador</span>
              <span style={{ fontSize: 11, fontFamily: 'Barlow Condensed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', textAlign: 'center' }}>Bruninho</span>
              <span style={{ fontSize: 11, fontFamily: 'Barlow Condensed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', textAlign: 'center' }}>Simões</span>
              <span style={{ fontSize: 11, fontFamily: 'Barlow Condensed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', textAlign: 'center' }}>Média</span>
            </div>

            {players.map(player => (
              <Link key={player.player_id} href={`/jogadores/${player.player_id}`}>
                <div className="card" style={{ cursor: 'pointer' }}>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px',
                    alignItems: 'center', gap: 8,
                  }}>
                    {/* Player info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Bebas Neue', fontSize: 14, color: 'var(--text-muted)',
                        flexShrink: 0,
                      }}>
                        {player.number || '#'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{player.player_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed', letterSpacing: '0.04em' }}>
                          {player.position_in_match || player.position}
                        </div>
                      </div>
                      {player.tag === 'craque' && <span className="badge badge-gold" style={{ marginLeft: 4 }}>⭐ Craque</span>}
                      {player.tag === 'bagre' && <span className="badge badge-red" style={{ marginLeft: 4 }}>🐟 Bagre</span>}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <RatingBadge value={player.bruninho_rating} size="sm" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <RatingBadge value={player.simoes_rating} size="sm" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <RatingBadge value={player.average_rating} size="md" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getRatingColor(val) {
  const n = parseFloat(val);
  if (n >= 7) return 'var(--green)';
  if (n >= 5) return 'var(--gold)';
  return 'var(--red-primary)';
}
