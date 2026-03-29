'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatMatchDate } from '../../../lib/dateUtils';
import { playersApi } from '../../../lib/api';
import RatingBadge from '../../../components/RatingBadge';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { ArrowLeft, Target, Zap, Star, TrendingUp } from 'lucide-react';

export default function PlayerDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!id) return;
    playersApi.getById(id, { season: currentYear })
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-container" style={{ paddingTop: 40 }}><LoadingSpinner /></div>;
  if (!data) return null;

  const { player, stats, history } = data;

  return (
    <div className="page-container fade-in" style={{ paddingTop: 32, paddingBottom: 80 }}>
      <Link href="/jogadores" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, marginBottom: 24, fontFamily: 'Barlow Condensed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <ArrowLeft size={16} /> Jogadores
      </Link>

      {/* Player header */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <div style={{
          width: 80, height: 80, borderRadius: 16, flexShrink: 0, overflow: 'hidden',
          background: 'var(--bg-secondary)', border: '2px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {player.photo_url ? (
            <img src={player.photo_url} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
          ) : null}
          <span style={{ display: player.photo_url ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue', fontSize: 28, color: 'var(--red-primary)', width: '100%', height: '100%' }}>
            {player.number || '?'}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 48, lineHeight: 1, marginBottom: 6 }}>{player.name}</h1>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge badge-gray">{player.position}</span>
            {!player.active && <span className="badge badge-red">Inativo</span>}
          </div>
        </div>
        {stats.avg_overall && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontFamily: 'Barlow Condensed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>
              Média {currentYear}
            </div>
            <RatingBadge value={stats.avg_overall} size="lg" />
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 32 }}>
        {[
          { label: 'Jogos', value: stats.games || 0, icon: <TrendingUp size={16} /> },
          { label: 'Média Bruninho', value: stats.avg_bruninho ? Number(stats.avg_bruninho).toFixed(2) : '—', icon: '🎙️' },
          { label: 'Média Simões', value: stats.avg_simoes ? Number(stats.avg_simoes).toFixed(2) : '—', icon: '🎤' },
          { label: 'Melhor nota', value: stats.best_rating ? Number(stats.best_rating).toFixed(1) : '—', icon: <Star size={16} color="var(--gold)" /> },
          { label: 'Pior nota', value: stats.worst_rating ? Number(stats.worst_rating).toFixed(1) : '—', icon: '📉' },
          { label: 'Gols', value: stats.goals || 0, icon: <Target size={16} color="var(--green)" /> },
          { label: 'Assistências', value: stats.assists || 0, icon: <Zap size={16} color="var(--blue)" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'center' }}>
              {typeof icon === 'string' ? <span style={{ fontSize: 18 }}>{icon}</span> : icon}
            </div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 28, lineHeight: 1, marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 11, fontFamily: 'Barlow Condensed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Match history */}
      <h2 style={{ fontSize: 32, marginBottom: 16 }}>
        Histórico de <span style={{ color: 'var(--red-primary)' }}>Jogos</span>
      </h2>

      {history.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
          Nenhum jogo registrado para este jogador na temporada {currentYear}.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {history.map(h => {

            const flaWon = h.flamengo_goals > h.opponent_goals;
            const drew = h.flamengo_goals === h.opponent_goals;
            const rc = flaWon ? 'var(--green)' : drew ? 'var(--gold)' : 'var(--red-primary)';

            return (
              <Link key={h.match_id} href={`/jogos/${h.match_id}`}>
                <div className="card" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span className="badge badge-gray" style={{ fontSize: 10 }}>{h.championship}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {formatMatchDate(h.match_date, 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>FLA</span>
                      <span style={{ fontFamily: 'Bebas Neue', fontSize: 20, color: rc }}>
                        {h.flamengo_goals} × {h.opponent_goals}
                      </span>
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{h.opponent_name}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <RatingBadge value={h.bruninho_rating} size="sm" label="Bruninho" />
                    <RatingBadge value={h.simoes_rating} size="sm" label="Simões" />
                    <RatingBadge value={h.average_rating} size="md" label="Média" />
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