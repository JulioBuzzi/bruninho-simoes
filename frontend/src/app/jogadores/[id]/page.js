'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { playersApi } from '../../../lib/api';
import { formatMatchDate } from '../../../lib/dateUtils';
import RatingBadge from '../../../components/RatingBadge';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { ArrowLeft, Target, Zap, Star, TrendingUp, TrendingDown } from 'lucide-react';

// Stat card — fixed height so all cards align
function StatCard({ icon, label, value, color }) {
  return (
    <div className="card" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '20px 12px', minHeight: 110, gap: 6,
    }}>
      <div style={{ height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {typeof icon === 'string'
          ? <span style={{ fontSize: 20 }}>{icon}</span>
          : icon}
      </div>
      <div style={{
        fontFamily: 'Bebas Neue', fontSize: 30, lineHeight: 1,
        color: color || 'var(--text-primary)',
      }}>{value}</div>
      <div style={{
        fontSize: 10, fontFamily: 'Barlow Condensed', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)',
      }}>{label}</div>
    </div>
  );
}

function pluralJogos(n) {
  const num = parseInt(n) || 0;
  if (num === 0) return '0 jogos';
  if (num === 1) return '1 jogo';
  return `${num} jogos`;
}

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

  const statCards = [
    { icon: <TrendingUp size={20} color="var(--text-muted)" />, label: 'Jogos', value: pluralJogos(stats.games) },
    { icon: '🎙️', label: 'Média Bruninho', value: stats.avg_bruninho ? Number(stats.avg_bruninho).toFixed(2) : '—' },
    { icon: '🎤', label: 'Média Simões',   value: stats.avg_simoes  ? Number(stats.avg_simoes).toFixed(2)  : '—' },
    { icon: <Star size={20} color="var(--gold)" fill="var(--gold)" />, label: 'Melhor nota', value: stats.best_rating ? Number(stats.best_rating).toFixed(1) : '—', color: 'var(--gold)' },
    { icon: <TrendingDown size={20} color="var(--red-primary)" />, label: 'Pior nota',   value: stats.worst_rating ? Number(stats.worst_rating).toFixed(1) : '—', color: 'var(--red-primary)' },
    { icon: <Target size={20} color="var(--green)" />, label: 'Gols',        value: stats.goals   || 0, color: 'var(--green)' },
    { icon: <Zap size={20} color="var(--blue)" />,   label: 'Assistências', value: stats.assists || 0, color: 'var(--blue)' },
  ];

  return (
    <div className="page-container fade-in" style={{ paddingTop: 32, paddingBottom: 80 }}>
      <Link href="/jogadores" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, marginBottom: 24, fontFamily: 'Barlow Condensed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <ArrowLeft size={16} /> Jogadores
      </Link>

      {/* Player header */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ width: 80, height: 80, borderRadius: 16, flexShrink: 0, overflow: 'hidden', background: 'var(--bg-secondary)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {player.photo_url
            ? <img src={player.photo_url} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
            : null}
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

      {/* Stats grid — all same height */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, marginBottom: 32 }}>
        {statCards.map(s => <StatCard key={s.label} {...s} />)}
      </div>
      <style>{`@media(max-width:900px){.stat-grid{grid-template-columns:repeat(4,1fr)!important}}@media(max-width:560px){.stat-grid{grid-template-columns:repeat(3,1fr)!important}}`}</style>

      {/* Match history */}
      <h2 style={{ fontSize: 32, marginBottom: 16 }}>Histórico de <span style={{ color: 'var(--red-primary)' }}>Jogos</span></h2>

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
                      <span style={{ fontFamily: 'Bebas Neue', fontSize: 20, color: rc }}>{h.flamengo_goals} × {h.opponent_goals}</span>
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{h.opponent_name}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <RatingBadge value={h.simoes_rating} size="sm" label="Simões" />
                    <RatingBadge value={h.bruninho_rating} size="sm" label="Bruninho" />
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