'use client';
import { useState, useEffect } from 'react';
import { matchesApi } from '../lib/api';
import MatchCard from '../components/MatchCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Filter, ChevronLeft, ChevronRight, Flame } from 'lucide-react';

export default function HomePage() {
  const [matches, setMatches] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState([]);
  const [championships, setChampionships] = useState([]);
  const [filters, setFilters] = useState({ championship: '', season: '', page: 1 });

  useEffect(() => {
    matchesApi.getSeasons().then(setSeasons).catch(() => {});
    matchesApi.getChampionships().then(setChampionships).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filters.championship) params.championship = filters.championship;
    if (filters.season) params.season = filters.season;
    params.page = filters.page;
    params.limit = 15;

    matchesApi.getAll(params)
      .then(data => {
        setMatches(data.data || []);
        setPagination(data.pagination || {});
      })
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, [filters]);

  const handleFilter = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: val, page: 1 }));
  };

  return (
    <div className="page-container fade-in" style={{ paddingTop: 40, paddingBottom: 60 }}>
      {/* Hero */}
      <div style={{ marginBottom: 36, position: 'relative' }}>
        <div style={{
          position: 'absolute', top: -20, left: -10,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,0,28,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Flame size={28} color="var(--red-primary)" />
          <h1 style={{ fontSize: 48, color: 'var(--text-primary)' }}>
            Jogos do <span style={{ color: 'var(--red-primary)' }}>Mengão</span>
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
          Notas dos titulares por Bruninho e Simões após cada partida.
        </p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 28, display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', marginRight: 4 }}>
          <Filter size={16} />
          <span style={{ fontFamily: 'Barlow Condensed', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Filtros
          </span>
        </div>

        <div style={{ minWidth: 180 }}>
          <label>Campeonato</label>
          <select className="input" value={filters.championship} onChange={e => handleFilter('championship', e.target.value)}>
            <option value="">Todos</option>
            {championships.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ minWidth: 140 }}>
          <label>Temporada</label>
          <select className="input" value={filters.season} onChange={e => handleFilter('season', e.target.value)}>
            <option value="">Todas</option>
            {seasons.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {(filters.championship || filters.season) && (
          <button className="btn btn-ghost" onClick={() => setFilters({ championship: '', season: '', page: 1 })}>
            Limpar filtros
          </button>
        )}
      </div>

      {/* Stats bar */}
      {pagination.total > 0 && (
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{pagination.total}</strong> jogos encontrados
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Página {pagination.page} de {pagination.pages}
          </span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Carregando jogos..." />
      ) : matches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚽</div>
          <p style={{ fontFamily: 'Bebas Neue', fontSize: 24, marginBottom: 8 }}>Nenhum jogo encontrado</p>
          <p style={{ fontSize: 14 }}>Tente ajustar os filtros ou aguarde novos jogos.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {matches.map(match => <MatchCard key={match.id} match={match} />)}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
          <button
            className="btn btn-ghost"
            disabled={pagination.page <= 1}
            onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
            style={{ opacity: pagination.page <= 1 ? 0.4 : 1 }}
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 16px', fontFamily: 'Barlow Condensed', color: 'var(--text-secondary)' }}>
            {pagination.page} / {pagination.pages}
          </span>
          <button
            className="btn btn-ghost"
            disabled={pagination.page >= pagination.pages}
            onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
            style={{ opacity: pagination.page >= pagination.pages ? 0.4 : 1 }}
          >
            Próxima <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
