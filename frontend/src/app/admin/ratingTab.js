'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { matchesApi, ratingsApi } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTokenRefresh } from '../../lib/useTokenRefresh';
import { Save, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const POSITION_SORT = {'Goleiro':1,'Lateral Direito':2,'Zagueiro':3,'Lateral Esquerdo':4,'Volante':5,'Meia':6,'Atacante':7};
function sortByPosition(players) {
  return [...players].sort((a,b) => {
    const pa = POSITION_SORT[a.position_in_match||a.position]??99;
    const pb = POSITION_SORT[b.position_in_match||b.position]??99;
    return pa !== pb ? pa-pb : (a.player_name||'').localeCompare(b.player_name||'');
  });
}

function getRatingColor(val) {
  const n = parseFloat(val);
  if (n >= 7) return 'var(--green)';
  if (n >= 5) return 'var(--gold)';
  return 'var(--red-primary)';
}

const thStyle = {
  padding: '12px 16px', textAlign: 'left', fontSize: 11,
  fontFamily: 'Barlow Condensed', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.06em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)',
};

export default function RatingsTab({ matches, players, currentUser, onRefresh }) {
  // Keep token alive while user is filling notes
  useTokenRefresh();

  const [selectedMatch, setSelectedMatch] = useState('');
  const [matchData,     setMatchData]     = useState(null);
  const [ratings,       setRatings]       = useState({});
  const [loading,       setLoading]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  // Track which players have been autosaved
  const [autoSaved,     setAutoSaved]     = useState({}); // { player_id: true }
  const [lastSaved,     setLastSaved]     = useState(null); // timestamp

  const autosaveTimerRef = useRef(null);

  const loadMatch = async (matchId) => {
    if (!matchId) return;
    setLoading(true);
    setAutoSaved({});
    setLastSaved(null);
    try {
      const data = await matchesApi.getById(matchId);
      setMatchData(data);
      const r = {};
      data.players.forEach(p => {
        r[p.player_id] = { bruninho: p.bruninho_rating ?? '', simoes: p.simoes_rating ?? '' };
      });
      setRatings(r);
    } catch { toast.error('Erro ao carregar jogo'); }
    finally { setLoading(false); }
  };

  // Build rating payload from current state
  const buildRatingsList = useCallback((currentRatings) => {
    return Object.entries(currentRatings)
      .map(([player_id, r]) => ({
        player_id,
        bruninho_rating: r.bruninho !== '' ? parseFloat(r.bruninho) : null,
        simoes_rating:   r.simoes   !== '' ? parseFloat(r.simoes)   : null,
      }))
      .filter(r => r.bruninho_rating !== null || r.simoes_rating !== null);
  }, []);

  // Save all current ratings
  const saveAll = useCallback(async (currentRatings, silent = false) => {
    if (!selectedMatch) return;
    const list = buildRatingsList(currentRatings);
    if (list.length === 0) return;
    setSaving(true);
    try {
      await ratingsApi.save({ match_id: selectedMatch, ratings: list });
      setLastSaved(new Date());
      if (!silent) {
        toast.success('Notas salvas!');
        onRefresh();
      }
    } catch (err) {
      if (!silent) toast.error('Erro ao salvar: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  }, [selectedMatch, buildRatingsList, onRefresh]);

  // When a rating changes, check if this player now has both notes → autosave
  const handleRatingChange = (playerId, field, value) => {
    setRatings(prev => {
      const updated = { ...prev, [playerId]: { ...prev[playerId], [field]: value } };
      const r = updated[playerId];
      const bothFilled = r.bruninho !== '' && r.simoes !== '';

      if (bothFilled) {
        // Debounce: wait 800ms after user stops typing before autosaving
        if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = setTimeout(async () => {
          // Save just this one player silently
          const single = [{
            player_id: playerId,
            bruninho_rating: parseFloat(r.bruninho),
            simoes_rating:   parseFloat(r.simoes),
          }];
          try {
            await ratingsApi.save({ match_id: selectedMatch, ratings: single });
            setAutoSaved(p => ({ ...p, [playerId]: true }));
            setLastSaved(new Date());
          } catch {
            // Will be caught on manual save
          }
        }, 800);
      }

      return updated;
    });
  };

  // Cleanup timer on unmount
  useEffect(() => () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current); }, []);

  const handleManualSave = () => saveAll(ratings, false);

  const m = matchData?.match;

  // Count how many players have both notes filled
  const totalPlayers = matchData?.players?.length || 0;
  const filledCount  = Object.values(ratings).filter(r => r.bruninho !== '' && r.simoes !== '').length;
  const allFilled    = totalPlayers > 0 && filledCount === totalPlayers;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 28 }}>Inserir Notas</h2>
        {/* Last saved indicator */}
        {lastSaved && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--green)', fontFamily: 'Barlow Condensed' }}>
            <CheckCircle size={14} />
            Salvo às {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 300, flex: 1 }}>
          <label>Selecione o Jogo</label>
          <select className="input" value={selectedMatch} onChange={e => { setSelectedMatch(e.target.value); loadMatch(e.target.value); }}>
            <option value="">Selecione...</option>
            {matches.map(m => (
              <option key={m.id} value={m.id}>
                {m.match_date?.slice(0, 10)} • FLA {m.flamengo_goals}×{m.opponent_goals} {m.opponent_name} ({m.championship})
              </option>
            ))}
          </select>
        </div>
        {selectedMatch && (
          <button className="btn btn-primary" onClick={handleManualSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Notas'}
          </button>
        )}
      </div>

      {loading && <LoadingSpinner text="Carregando titulares..." />}

      {matchData && !loading && (
        <>
          {/* Match info bar */}
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Bebas Neue', fontSize: 20 }}>FLA {m.flamengo_goals} × {m.opponent_goals} {m.opponent_name}</span>
            <span className="badge badge-gray">{m.championship}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{m.match_date?.slice(0, 10)}</span>
          </div>

          {/* Progress bar */}
          {totalPlayers > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontFamily: 'Barlow Condensed', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                  {filledCount}/{totalPlayers} jogadores com as duas notas preenchidas
                  {filledCount > 0 && filledCount < totalPlayers && (
                    <span style={{ marginLeft: 8, color: 'var(--gold)' }}>
                      <Clock size={12} style={{ verticalAlign: 'middle' }} /> Salvamento automático ativo
                    </span>
                  )}
                </span>
                {allFilled && (
                  <span style={{ fontSize: 12, color: 'var(--green)', fontFamily: 'Barlow Condensed', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle size={14} /> Todas as notas preenchidas!
                  </span>
                )}
              </div>
              <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${totalPlayers > 0 ? (filledCount / totalPlayers) * 100 : 0}%`,
                  background: allFilled ? 'var(--green)' : 'var(--gold)',
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          )}

          {matchData.players.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
              Jogo sem titulares cadastrados. Use a aba de Jogos para editar a escalação.
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    <th style={thStyle}>Jogador</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Pos.</th>
                    <th style={{ ...thStyle, textAlign: 'center', color: 'var(--red-primary)' }}>🎤 Simões (0-10)</th>
                    <th style={{ ...thStyle, textAlign: 'center', color: '#448aff' }}>🎙️ Bruninho (0-10)</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Média</th>
                    <th style={{ ...thStyle, textAlign: 'center', width: 32 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {sortByPosition(matchData.players).map((player, i) => {
                    const r = ratings[player.player_id] || { bruninho: '', simoes: '' };
                    const bothFilled = r.bruninho !== '' && r.simoes !== '';
                    const avg = bothFilled
                      ? ((parseFloat(r.bruninho) + parseFloat(r.simoes)) / 2).toFixed(2)
                      : r.bruninho !== '' ? parseFloat(r.bruninho).toFixed(1)
                      : r.simoes   !== '' ? parseFloat(r.simoes).toFixed(1)
                      : '—';
                    const wasSaved = autoSaved[player.player_id];

                    return (
                      <tr key={player.player_id} style={{
                        borderBottom: '1px solid var(--border)',
                        background: wasSaved
                          ? 'rgba(0,200,83,0.04)'
                          : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                        transition: 'background 0.3s',
                      }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                          {player.number && <span style={{ color: 'var(--text-muted)', marginRight: 8, fontFamily: 'Barlow Condensed' }}>#{player.number}</span>}
                          {player.player_name}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed' }}>
                          {player.position}
                        </td>
                        <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                          <input
                            type="number" min="0" max="10" step="0.5" className="input"
                            value={r.simoes}
                            onChange={e => handleRatingChange(player.player_id, 'simoes', e.target.value)}
                            style={{ width: 80, textAlign: 'center', margin: '0 auto' }}
                            placeholder="—"
                          />
                        </td>
                        <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                          <input
                            type="number" min="0" max="10" step="0.5" className="input"
                            value={r.bruninho}
                            onChange={e => handleRatingChange(player.player_id, 'bruninho', e.target.value)}
                            style={{ width: 80, textAlign: 'center', margin: '0 auto' }}
                            placeholder="—"
                          />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'Bebas Neue', fontSize: 20, color: avg !== '—' ? getRatingColor(avg) : 'var(--text-muted)' }}>
                          {avg}
                        </td>
                        {/* Autosave indicator */}
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          {wasSaved && <CheckCircle size={16} color="var(--green)" title="Salvo automaticamente" />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {matchData.players.length > 0 && (
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <button className="btn btn-primary" onClick={handleManualSave} disabled={saving}>
                <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Todas as Notas'}
              </button>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed' }}>
                As notas também são salvas automaticamente quando as duas notas de um jogador são preenchidas.
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}