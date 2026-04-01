'use client';
import Link from 'next/link';
import Image from 'next/image';
import { formatMatchDate } from '../lib/dateUtils';
import { Star, Home, Plane } from 'lucide-react';

const CHAMPIONSHIPS = {
  'Brasileirão':  { color: '#2ecc71', short: 'BRA' },
  'Carioca':      { color: '#e74c3c', short: 'CAR' },
  'Libertadores': { color: '#f5c842', short: 'LIB' },
  'Copa do Brasil':{ color: '#3498db', short: 'CDB' },
  'Supercopa':    { color: '#e67e22', short: 'SUP' },
  'Recopa':       { color: '#9b59b6', short: 'REC' },
  'Amistoso':     { color: '#95a5a6', short: 'AMI' },
};

function getResultStyle(fla, opp) {
  if (fla > opp) return { color: 'var(--green)' };
  if (fla < opp) return { color: 'var(--red-primary)' };
  return { color: 'var(--gold)' };
}

export default function MatchCard({ match }) {
  const result = getResultStyle(match.flamengo_goals, match.opponent_goals);
  const champ = CHAMPIONSHIPS[match.championship] || { color: '#888', short: '—' };

  return (
    <Link href={`/jogos/${match.id}`}>
      <div className="card" style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
        {/* Result stripe */}
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0, width: 4,
          background: result.color,
        }} />

        <div style={{ paddingLeft: 12 }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="badge" style={{
                background: `${champ.color}20`,
                color: champ.color,
                border: `1px solid ${champ.color}40`,
                fontSize: 10, fontWeight: 700,
              }}>
                {match.championship}
              </span>
              {match.round && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed' }}>
                  {match.round}
                </span>
              )}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {match.is_home
                ? <><Home size={12} /> Casa</>
                : <><Plane size={12} /> Fora</>
              }
            </span>
          </div>

          {/* Score block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
            {/* Flamengo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img
                  src="/logos/flamengo.png"
                  alt="Flamengo"
                  style={{ width: 32, height: 32, objectFit: 'contain' }}
                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
                <span style={{ display: 'none', fontFamily: 'Bebas Neue', fontSize: 13, color: 'var(--red-primary)' }}>FLA</span>
              </div>
              <span style={{ fontFamily: 'Bebas Neue', fontSize: 14, color: 'var(--text-secondary)' }}>
                Flamengo
              </span>
            </div>

            {/* Score */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'Bebas Neue', fontSize: 32, color: result.color, minWidth: 24, textAlign: 'center' }}>
                {match.flamengo_goals}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: 18, fontWeight: 300 }}>×</span>
              <span style={{ fontFamily: 'Bebas Neue', fontSize: 32, color: result.color, minWidth: 24, textAlign: 'center' }}>
                {match.opponent_goals}
              </span>
            </div>

            {/* Opponent */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'flex-end' }}>
              <span style={{ fontFamily: 'Bebas Neue', fontSize: 14, color: 'var(--text-secondary)', textAlign: 'right' }}>
                {match.opponent_name}
              </span>
              <div style={{ width: 40, height: 40, flexShrink: 0, position: 'relative', borderRadius: 8, overflow: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {match.opponent_logo ? (
                  <img
                    src={match.opponent_logo}
                    alt={match.opponent_name}
                    style={{ width: 32, height: 32, objectFit: 'contain' }}
                    onError={e => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                <span style={{ display: match.opponent_logo ? 'none' : 'block', fontFamily: 'Bebas Neue', fontSize: 11, color: 'var(--text-muted)' }}>
                  {match.opponent_short || match.opponent_name?.slice(0,3).toUpperCase() || '?'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {formatMatchDate(match.match_date)}
            </span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {!(match.team_avg > 0) && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed', letterSpacing: '0.04em', fontStyle: 'italic' }}>
                  Sem notas
                </span>
              )}
              {match.team_avg > 0 && (
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Média: <strong style={{ color: getRatingColor(match.team_avg) }}>{Number(match.team_avg).toFixed(1)}</strong>
                </span>
              )}
              {match.mvp_name && (
                <span style={{ fontSize: 11, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Star size={11} fill="var(--gold)" /> {match.mvp_name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function getRatingColor(val) {
  const n = parseFloat(val);
  if (n >= 7) return 'var(--green)';
  if (n >= 5) return 'var(--gold)';
  return 'var(--red-primary)';
}