'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { playersApi, ratingsApi } from '../../lib/api';
import RatingBadge from '../../components/RatingBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Users } from 'lucide-react';

// Filtros exatos — sem usar .includes() que misturava laterais
const POSITIONS = [
  'Todos',
  'Goleiro',
  'Lateral Direito',
  'Lateral Esquerdo',
  'Zagueiro',
  'Volante',
  'Meia',
  'Atacante',
];

function matchPosition(playerPos, filter) {
  if (filter === 'Todos') return true;
  // Comparação exata (case-insensitive) para não misturar Lateral D com E
  return (playerPos || '').toLowerCase().trim() === filter.toLowerCase().trim();
}

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posFilter, setPosFilter] = useState('Todos');
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    Promise.all([
      playersApi.getAll({ active: true }),
      ratingsApi.getStats({ season: currentYear }),
    ]).then(([p, s]) => {
      setPlayers(p);
      setStats(s.ranking || []);
    }).finally(() => setLoading(false));
  }, []);

  const merged = players.map(p => {
    const stat = stats.find(s => s.id === p.id);
    return { ...p, ...stat };
  });

  const filtered = merged.filter(p => matchPosition(p.position, posFilter));

  return (
    <div className="page-container fade-in" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <Users size={28} color="var(--red-primary)" />
        <h1 style={{ fontSize: 48 }}>Jogadores <span style={{ color: 'var(--red-primary)' }}>{currentYear}</span></h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>Médias e desempenho na temporada atual.</p>

      {/* Position filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {POSITIONS.map(pos => (
          <button key={pos} onClick={() => setPosFilter(pos)} className="btn" style={{
            background: posFilter === pos ? 'var(--red-primary)' : 'var(--bg-card)',
            color: posFilter === pos ? 'white' : 'var(--text-secondary)',
            border: posFilter === pos ? 'none' : '1px solid var(--border)',
            padding: '6px 14px', fontSize: 12,
          }}>{pos}</button>
        ))}
      </div>

      {loading ? <LoadingSpinner text="Carregando jogadores..." /> : (
        <>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              Nenhum jogador encontrado para esta posição.
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {filtered.map(player => (
              <Link key={player.id} href={`/jogadores/${player.id}`}>
                <div className="card" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                    background: 'var(--bg-secondary)', border: '2px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Bebas Neue', fontSize: 18, color: 'var(--text-secondary)',
                  }}>
                    {player.number || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {player.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed', letterSpacing: '0.04em' }}>
                      {player.position}
                    </div>
                    {player.games > 0 && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {player.games} jogos
                      </div>
                    )}
                  </div>
                  <div>
                    <RatingBadge value={player.avg_overall} size="sm" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}