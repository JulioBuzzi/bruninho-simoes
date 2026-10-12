'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { ratingsApi } from '../lib/api';
import { formatMatchDate } from '../lib/dateUtils';
import LoadingSpinner from './LoadingSpinner';
import RatingBadge from './RatingBadge';
import { filterGames } from '../lib/playerGamesFilter';

// Colunas clicáveis do ranking e como cada uma filtra os jogos.
// As regras espelham exatamente as consultas de GET /ratings/stats.
export const COLUMN_INFO = {
  games:    { title: 'Jogos',             empty: 'Nenhum jogo com nota para este jogador.' },
  bruninho: { title: 'Notas do Bruninho', empty: 'Bruninho não deu nota a este jogador nesse período.' },
  simoes:   { title: 'Notas do Simões',   empty: 'Simões não deu nota a este jogador nesse período.' },
  best:     { title: 'Melhor nota',       empty: 'Este jogador ainda não tem média registrada.' },
  craque:   { title: 'Jogos como Craque', empty: 'Este jogador ainda não foi craque de nenhum jogo.' },
  bagre:    { title: 'Jogos como Bagre',  empty: 'Este jogador ainda não foi bagre de nenhum jogo.' },
};

export default function PlayerGamesModal({ player, column, season, championship, onClose }) {
  const [rows, setRows]       = useState(null);
  const [error, setError]     = useState(false);
  const closeBtnRef           = useRef(null);
  const info                  = COLUMN_INFO[column];

  // Busca as notas do jogador na temporada (e no campeonato, se houver)
  useEffect(() => {
    let alive = true;
    setRows(null);
    setError(false);
    const params = { season };
    if (championship) params.championship = championship;
    ratingsApi.getPlayerHistory(player.id, params)
      .then(data => { if (alive) setRows(data); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [player.id, season, championship]);

  // Fechar com Esc + travar o scroll da página enquanto o painel está aberto
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = oldOverflow;
    };
  }, [onClose]);

  const games = rows ? filterGames(rows, column, !championship) : [];

  // Valor principal mostrado em cada linha, conforme a coluna clicada
  const mainValue = r =>
    column === 'bruninho' ? r.bruninho_rating :
    column === 'simoes'   ? r.simoes_rating   :
    r.average_rating;
  const mainLabel = column === 'bruninho' ? 'Bruninho' : column === 'simoes' ? 'Simões' : 'Média';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(5,5,10,0.75)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-games-title"
        onClick={e => e.stopPropagation()}
        className="card fade-in"
        style={{
          width: '100%', maxWidth: 620, maxHeight: '85vh', padding: 0,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontFamily: 'Barlow Condensed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--red-primary)' }}>
              {info?.title}
            </div>
            <h2 id="player-games-title" style={{ fontSize: 30, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {player.name}
            </h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              <span className="badge badge-gray">Temporada {season}</span>
              <span className="badge badge-gray">{championship || 'Todos os campeonatos'}</span>
              {rows && <span className="badge badge-gray">{games.length} jogo{games.length !== 1 ? 's' : ''}</span>}
            </div>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="btn btn-ghost"
            style={{ padding: '6px 10px', flexShrink: 0 }}
          >
            <X size={18} /> <span style={{ fontSize: 12 }}>Fechar</span>
          </button>
        </div>

        {/* Conteúdo */}
        <div style={{ overflowY: 'auto', padding: '12px 16px 16px' }}>
          {error ? (
            <p style={{ textAlign: 'center', padding: '32px 8px', color: 'var(--text-muted)' }}>Não foi possível carregar os jogos. Tente novamente.</p>
          ) : !rows ? (
            <LoadingSpinner text="Carregando jogos..." />
          ) : games.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '32px 8px', color: 'var(--text-muted)' }}>{info?.empty}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {games.map(r => <GameRow key={r.id} r={r} value={mainValue(r)} label={mainLabel} column={column} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GameRow({ r, value, label, column }) {
  const fla = r.flamengo_goals, opp = r.opponent_goals;
  const rc = fla > opp ? 'var(--green)' : fla < opp ? 'var(--red-primary)' : 'var(--gold)';
  const showBothNotes = column === 'games' || column === 'best' || column === 'craque' || column === 'bagre';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      padding: '10px 12px', borderRadius: 10,
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    }}>
      {/* Logo adversário */}
      <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {r.opponent_logo
          ? <img src={r.opponent_logo} alt={r.opponent_name} style={{ width: 28, height: 28, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
          : <span style={{ fontFamily: 'Bebas Neue', fontSize: 11, color: 'var(--text-muted)' }}>{r.opponent_name?.slice(0, 3).toUpperCase()}</span>}
      </div>

      {/* Jogo */}
      <div style={{ flex: 1, minWidth: 170 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 18, color: rc }}>FLA {fla} × {opp}</span>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{r.opponent_name}</span>
          {r.had_penalties && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed' }}>(pên. {r.flamengo_penalties}×{r.opponent_penalties})</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2, fontSize: 12, color: 'var(--text-muted)' }}>
          <span>{formatMatchDate(r.match_date, 'dd/MM/yyyy')}</span>
          <span>•</span>
          <span>{r.championship}{r.round ? ` · ${r.round}` : ''}</span>
          <span>•</span>
          <span>{r.is_home ? 'Casa' : 'Fora'}</span>
          {!r.is_starter && <span className="badge badge-red" style={{ fontSize: 10 }}>Fora da escalação salva</span>}
          {column !== 'craque' && r.is_craque && <span className="badge badge-gold" style={{ fontSize: 10 }}>⭐ Craque</span>}
          {column !== 'bagre' && r.is_bagre && !r.is_craque && <span className="badge badge-red" style={{ fontSize: 10 }}>🐟 Bagre</span>}
        </div>
        <Link href={`/jogos/${r.match_id}`} style={{ display: 'inline-block', marginTop: 4, fontSize: 12, color: 'var(--red-primary)', fontFamily: 'Barlow Condensed', fontWeight: 600, letterSpacing: '0.04em' }}>
          Ver jogo →
        </Link>
      </div>

      {/* Notas */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginLeft: 'auto' }}>
        {showBothNotes && (
          <>
            <RatingBadge value={r.simoes_rating} size="sm" label="Simões" />
            <RatingBadge value={r.bruninho_rating} size="sm" label="Bruninho" />
          </>
        )}
        <RatingBadge value={value} size="md" label={label} />
      </div>
    </div>
  );
}