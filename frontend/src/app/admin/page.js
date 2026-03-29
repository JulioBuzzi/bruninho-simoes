'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { matchesApi, playersApi, teamsApi, ratingsApi, authApi } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { Plus, LogOut, Settings, Save, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const CHAMPIONSHIPS = ['Brasileirão', 'Carioca', 'Libertadores', 'Copa do Brasil', 'Supercopa', 'Recopa', 'Amistoso'];
const POSITIONS = ['Goleiro', 'Zagueiro', 'Lateral Direito', 'Lateral Esquerdo', 'Volante', 'Meia', 'Atacante'];

// Ordem de exibição na tabela de notas
const POSITION_SORT = {
  'Goleiro': 1,
  'Lateral Direito': 2,
  'Zagueiro': 3,
  'Lateral Esquerdo': 4,
  'Volante': 5,
  'Meia': 6,
  'Atacante': 7,
};

function sortPlayersByPosition(players) {
  return [...players].sort((a, b) => {
    const posA = POSITION_SORT[a.position_in_match || a.position] ?? 99;
    const posB = POSITION_SORT[b.position_in_match || b.position] ?? 99;
    if (posA !== posB) return posA - posB;
    return (a.player_name || a.name || '').localeCompare(b.player_name || b.name || '');
  });
}


export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState('matches');
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  // Check auth
  useEffect(() => {
    const token = localStorage.getItem('bs_token');
    const u = localStorage.getItem('bs_user');
    if (!token || !u) { router.push('/admin/login'); return; }
    setUser(JSON.parse(u));
    setChecking(false);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [m, p, t] = await Promise.all([
        matchesApi.getAll({ limit: 30 }),
        playersApi.getAll(),
        teamsApi.getAll(),
      ]);
      setMatches(m.data || []);
      setPlayers(p);
      setTeams(t);
    } catch (err) {
      toast.error('Erro ao carregar dados');
    }
  }, []);

  useEffect(() => { if (!checking) fetchData(); }, [checking, fetchData]);

  const handleLogout = () => {
    localStorage.removeItem('bs_token');
    localStorage.removeItem('bs_user');
    router.push('/admin/login');
  };

  if (checking) return <div className="page-container" style={{ paddingTop: 40 }}><LoadingSpinner /></div>;

  const tabs = [
    { id: 'matches', label: 'Jogos' },
    { id: 'ratings', label: 'Notas' },
    { id: 'players', label: 'Jogadores' },
    { id: 'teams', label: 'Times' },
  ];

  return (
    <div className="page-container fade-in" style={{ paddingTop: 32, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 40 }}>Admin <span style={{ color: 'var(--red-primary)' }}>Panel</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Logado como <strong style={{ color: 'var(--text-secondary)' }}>{user?.username}</strong></p>
        </div>
        <button className="btn btn-ghost" onClick={handleLogout}>
          <LogOut size={16} /> Sair
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {tabs.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 14,
            letterSpacing: '0.05em', textTransform: 'uppercase',
            color: tab === id ? 'var(--red-primary)' : 'var(--text-muted)',
            borderBottom: tab === id ? '2px solid var(--red-primary)' : '2px solid transparent',
            marginBottom: -1, transition: 'all 0.2s',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'matches' && <MatchesTab matches={matches} teams={teams} players={players} onRefresh={fetchData} />}
      {tab === 'ratings' && <RatingsTab matches={matches} players={players} onRefresh={fetchData} />}
      {tab === 'players' && <PlayersTab players={players} onRefresh={fetchData} />}
      {tab === 'teams' && <TeamsTab teams={teams} onRefresh={fetchData} />}
    </div>
  );
}

// ---- MATCHES TAB ----
function MatchesTab({ matches, teams, players, onRefresh }) {
  const emptyForm = {
    match_date: '', championship: 'Brasileirão', season: new Date().getFullYear(),
    opponent_id: '', flamengo_goals: 0, opponent_goals: 0, is_home: true,
    stadium: '', round: '', notes: '', starters: [], goals: [], assists: [],
  };
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Helpers para gols e assistências
  const addGoal = () => setForm(p => ({ ...p, goals: [...p.goals, { player_id: '', minute: '', is_own_goal: false, is_penalty: false }] }));
  const removeGoal = (i) => setForm(p => ({ ...p, goals: p.goals.filter((_, idx) => idx !== i) }));
  const updateGoal = (i, field, val) => setForm(p => ({ ...p, goals: p.goals.map((g, idx) => idx === i ? { ...g, [field]: val } : g) }));

  const addAssist = () => setForm(p => ({ ...p, assists: [...p.assists, { player_id: '', minute: '' }] }));
  const removeAssist = (i) => setForm(p => ({ ...p, assists: p.assists.filter((_, idx) => idx !== i) }));
  const updateAssist = (i, field, val) => setForm(p => ({ ...p, assists: p.assists.map((a, idx) => idx === i ? { ...a, [field]: val } : a) }));

  const handleSubmit = async () => {
    if (!form.match_date || !form.opponent_id) { toast.error('Preencha data e adversário'); return; }
    setLoading(true);
    try {
      await matchesApi.create({
        ...form,
        goals: form.goals.filter(g => g.player_id || g.is_own_goal),
        assists: form.assists.filter(a => a.player_id),
      });
      toast.success('Jogo criado!');
      setForm(emptyForm);
      setShowForm(false);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar jogo');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza? Isso apagará todas as notas do jogo.')) return;
    try {
      await matchesApi.delete(id);
      toast.success('Jogo removido');
      onRefresh();
    } catch { toast.error('Erro ao remover'); }
  };

  const activePlayers = players.filter(p => p.active);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 28 }}>Gerenciar Jogos</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Novo Jogo
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 22, marginBottom: 20 }}>Cadastrar Jogo</h3>

          {/* Campos principais */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div>
              <label>Data</label>
              <input type="date" className="input" value={form.match_date} onChange={e => setForm(p => ({ ...p, match_date: e.target.value }))} />
            </div>
            <div>
              <label>Campeonato</label>
              <select className="input" value={form.championship} onChange={e => setForm(p => ({ ...p, championship: e.target.value }))}>
                {CHAMPIONSHIPS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label>Temporada</label>
              <input type="number" className="input" value={form.season} onChange={e => setForm(p => ({ ...p, season: e.target.value }))} />
            </div>
            <div>
              <label>Adversário</label>
              <select className="input" value={form.opponent_id} onChange={e => setForm(p => ({ ...p, opponent_id: e.target.value }))}>
                <option value="">Selecione...</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label>Gols Flamengo</label>
              <input type="number" min="0" className="input" value={form.flamengo_goals} onChange={e => setForm(p => ({ ...p, flamengo_goals: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <label>Gols Adversário</label>
              <input type="number" min="0" className="input" value={form.opponent_goals} onChange={e => setForm(p => ({ ...p, opponent_goals: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <label>Mandante</label>
              <select className="input" value={form.is_home ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, is_home: e.target.value === 'true' }))}>
                <option value="true">Casa (Flamengo mandante)</option>
                <option value="false">Fora (Flamengo visitante)</option>
              </select>
            </div>
            <div>
              <label>Estádio (opcional)</label>
              <input className="input" value={form.stadium} onChange={e => setForm(p => ({ ...p, stadium: e.target.value }))} placeholder="Maracanã" />
            </div>
            <div>
              <label>Rodada/Fase (opcional)</label>
              <input className="input" value={form.round} onChange={e => setForm(p => ({ ...p, round: e.target.value }))} placeholder="Rodada 1" />
            </div>
          </div>

          {/* Titulares */}
          <div style={{ marginBottom: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ margin: 0 }}>Titulares</label>
              <span style={{ fontSize: 12, color: form.starters.length === 11 ? 'var(--green)' : 'var(--text-muted)' }}>
                {form.starters.length}/11 selecionados
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {activePlayers.map(player => {
                const selected = form.starters.find(s => s.player_id === player.id);
                return (
                  <button key={player.id} type="button" onClick={() => {
                    setForm(prev => {
                      const exists = prev.starters.find(s => s.player_id === player.id);
                      return { ...prev, starters: exists ? prev.starters.filter(s => s.player_id !== player.id) : [...prev.starters, { player_id: player.id, position: player.position }] };
                    });
                  }} style={{
                    padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                    background: selected ? 'var(--red-primary)' : 'var(--bg-secondary)',
                    color: selected ? 'white' : 'var(--text-secondary)',
                    fontFamily: 'Barlow', fontSize: 13, fontWeight: selected ? 600 : 400,
                    border: selected ? '1px solid var(--red-primary)' : '1px solid var(--border)',
                    transition: 'all 0.15s',
                  }}>
                    {player.number ? `#${player.number} ` : ''}{player.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gols */}
          <div style={{ marginBottom: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ margin: 0 }}>⚽ Gols do Flamengo</label>
              <button type="button" className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 12px' }} onClick={addGoal}>
                <Plus size={14} /> Adicionar Gol
              </button>
            </div>
            {form.goals.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nenhum gol adicionado.</p>
            )}
            {form.goals.map((goal, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 2, minWidth: 160 }}>
                  <select className="input" value={goal.player_id} onChange={e => updateGoal(i, 'player_id', e.target.value)}>
                    <option value="">Gol Contra</option>
                    {activePlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ width: 80 }}>
                  <input type="number" className="input" placeholder="Min." min="1" max="120"
                    value={goal.minute} onChange={e => updateGoal(i, 'minute', e.target.value)} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', textTransform: 'none', letterSpacing: 0 }}>
                  <input type="checkbox" checked={goal.is_penalty} onChange={e => updateGoal(i, 'is_penalty', e.target.checked)} />
                  Pênalti
                </label>
                <button type="button" onClick={() => removeGoal(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red-primary)', padding: 4 }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Assistências */}
          <div style={{ marginBottom: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ margin: 0 }}>🎯 Assistências</label>
              <button type="button" className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 12px' }} onClick={addAssist}>
                <Plus size={14} /> Adicionar Assistência
              </button>
            </div>
            {form.assists.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nenhuma assistência adicionada.</p>
            )}
            {form.assists.map((assist, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 2, minWidth: 160 }}>
                  <select className="input" value={assist.player_id} onChange={e => updateAssist(i, 'player_id', e.target.value)}>
                    <option value="">Selecione o jogador...</option>
                    {activePlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ width: 80 }}>
                  <input type="number" className="input" placeholder="Min." min="1" max="120"
                    value={assist.minute} onChange={e => updateAssist(i, 'minute', e.target.value)} />
                </div>
                <button type="button" onClick={() => removeAssist(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red-primary)', padding: 4 }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
              <Save size={16} /> {loading ? 'Salvando...' : 'Criar Jogo'}
            </button>
            <button className="btn btn-ghost" onClick={() => { setForm(emptyForm); setShowForm(false); }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Matches list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {matches.map(m => (
          <div key={m.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>
                Flamengo {m.flamengo_goals} × {m.opponent_goals} {m.opponent_name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {m.match_date?.slice(0, 10)} • {m.championship} {m.season}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href={`/jogos/${m.id}`} className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }}>Ver</Link>
              <button className="btn btn-ghost" onClick={() => handleDelete(m.id)} style={{ fontSize: 12, padding: '6px 12px', color: 'var(--red-primary)' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- RATINGS TAB ----
function RatingsTab({ matches, players, onRefresh }) {
  const [selectedMatch, setSelectedMatch] = useState('');
  const [matchData, setMatchData] = useState(null);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadMatch = async (matchId) => {
    if (!matchId) return;
    setLoading(true);
    try {
      const data = await matchesApi.getById(matchId);
      setMatchData(data);
      const r = {};
      data.players.forEach(p => {
        r[p.player_id] = {
          bruninho: p.bruninho_rating ?? '',
          simoes: p.simoes_rating ?? '',
        };
      });
      setRatings(r);
    } catch { toast.error('Erro ao carregar jogo'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!selectedMatch) return;
    setSaving(true);
    try {
      const ratingsList = Object.entries(ratings)
        .map(([player_id, r]) => ({
          player_id,
          bruninho_rating: r.bruninho !== '' ? parseFloat(r.bruninho) : null,
          simoes_rating: r.simoes !== '' ? parseFloat(r.simoes) : null,
        }))
        .filter(r => r.bruninho_rating !== null || r.simoes_rating !== null);

      await ratingsApi.save({ match_id: selectedMatch, ratings: ratingsList });
      toast.success('Notas salvas!');
      onRefresh();
    } catch { toast.error('Erro ao salvar notas'); }
    finally { setSaving(false); }
  };

  const m = matchData?.match;

  return (
    <div>
      <h2 style={{ fontSize: 28, marginBottom: 20 }}>Inserir Notas</h2>

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
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Notas'}
          </button>
        )}
      </div>

      {loading && <LoadingSpinner text="Carregando titulares..." />}

      {matchData && !loading && (
        <>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontFamily: 'Bebas Neue', fontSize: 20 }}>
              FLA {m.flamengo_goals} × {m.opponent_goals} {m.opponent_name}
            </span>
            <span className="badge badge-gray">{m.championship}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{m.match_date?.slice(0, 10)}</span>
          </div>

          {matchData.players.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
              Este jogo não possui titulares cadastrados. Cadastre o jogo com a escalação primeiro.
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    <th style={thStyle}>Jogador</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Posição</th>
                    <th style={{ ...thStyle, textAlign: 'center', color: 'var(--red-primary)' }}>🎤 Simões (0-10)</th>
                    <th style={{ ...thStyle, textAlign: 'center', color: '#448aff' }}>🎙️ Bruninho (0-10)</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Média</th>
                  </tr>
                </thead>
                <tbody>
                  {sortPlayersByPosition(matchData.players).map((player, i) => {
                    const r = ratings[player.player_id] || { bruninho: '', simoes: '' };
                    const avg = r.bruninho !== '' && r.simoes !== '' ? ((parseFloat(r.bruninho) + parseFloat(r.simoes)) / 2).toFixed(2) : '—';
                    return (
                      <tr key={player.player_id} style={{
                        borderBottom: '1px solid var(--border)',
                        background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
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
                            onChange={e => setRatings(prev => ({ ...prev, [player.player_id]: { ...prev[player.player_id], simoes: e.target.value } }))}
                            style={{ width: 80, textAlign: 'center', margin: '0 auto' }}
                            placeholder="—"
                          />
                        </td>
                        <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                          <input
                            type="number" min="0" max="10" step="0.5" className="input"
                            value={r.bruninho}
                            onChange={e => setRatings(prev => ({ ...prev, [player.player_id]: { ...prev[player.player_id], bruninho: e.target.value } }))}
                            style={{ width: 80, textAlign: 'center', margin: '0 auto' }}
                            placeholder="—"
                          />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'Bebas Neue', fontSize: 20, color: avg !== '—' ? getRatingColor(avg) : 'var(--text-muted)' }}>
                          {avg}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Todas as Notas'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ---- PLAYERS TAB ----
function PlayersTab({ players, onRefresh }) {
  const emptyForm = { name: '', position: 'Atacante', number: '', photo_url: '' };
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name) { toast.error('Nome é obrigatório'); return; }
    setLoading(true);
    try {
      await playersApi.create(form);
      toast.success('Jogador criado!');
      setForm(emptyForm);
      setShowForm(false);
      onRefresh();
    } catch { toast.error('Erro ao criar jogador'); }
    finally { setLoading(false); }
  };

  const toggleActive = async (player) => {
    try {
      await playersApi.update(player.id, { active: !player.active });
      toast.success(`${player.name} ${!player.active ? 'ativado' : 'desativado'}`);
      onRefresh();
    } catch { toast.error('Erro ao atualizar'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 28 }}>Jogadores</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={16} /> Novo</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 22, marginBottom: 16 }}>Cadastrar Jogador</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            <div><label>Nome</label><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome do jogador" /></div>
            <div><label>Posição</label>
              <select className="input" value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))}>
                {POSITIONS.map(pos => <option key={pos}>{pos}</option>)}
              </select>
            </div>
            <div><label>Número</label><input type="number" className="input" value={form.number} onChange={e => setForm(p => ({ ...p, number: e.target.value }))} placeholder="9" /></div>
            <div><label>Foto URL (opcional)</label><input className="input" value={form.photo_url} onChange={e => setForm(p => ({ ...p, photo_url: e.target.value }))} placeholder="https://..." /></div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}><Save size={16} /> Salvar</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {players.map(p => (
          <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: p.active ? 1 : 0.5 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue', fontSize: 14, color: 'var(--text-muted)', flexShrink: 0 }}>
              {p.number || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed' }}>{p.position}</div>
            </div>
            <button onClick={() => toggleActive(p)} className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 12px', color: p.active ? 'var(--green)' : 'var(--text-muted)' }}>
              {p.active ? 'Ativo' : 'Inativo'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- TEAMS TAB ----
function TeamsTab({ teams, onRefresh }) {
  const emptyForm = { name: '', short_name: '', logo_url: '', state: '', country: 'Brasil' };
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name) { toast.error('Nome é obrigatório'); return; }
    setLoading(true);
    try {
      await teamsApi.create(form);
      toast.success('Time criado!');
      setForm(emptyForm);
      setShowForm(false);
      onRefresh();
    } catch { toast.error('Erro ao criar time'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 28 }}>Times</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={16} /> Novo</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 22, marginBottom: 16 }}>Cadastrar Time</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            <div><label>Nome</label><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Palmeiras" /></div>
            <div><label>Abreviação</label><input className="input" value={form.short_name} onChange={e => setForm(p => ({ ...p, short_name: e.target.value }))} placeholder="PAL" maxLength={5} /></div>
            <div><label>Logo URL</label><input className="input" value={form.logo_url} onChange={e => setForm(p => ({ ...p, logo_url: e.target.value }))} placeholder="https://..." /></div>
            <div><label>Estado</label><input className="input" value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} placeholder="São Paulo" /></div>
            <div><label>País</label><input className="input" value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}><Save size={16} /> Salvar</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {teams.map(t => (
          <div key={t.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {t.logo_url ? (
              <img src={t.logo_url} alt={t.name} style={{ width: 36, height: 36, objectFit: 'contain' }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue', fontSize: 12, color: 'var(--text-muted)' }}>
                {t.short_name || t.name.slice(0, 3).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
              {t.state && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed' }}>{t.state}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const thStyle = {
  padding: '12px 16px', textAlign: 'left',
  fontSize: 11, fontFamily: 'Barlow Condensed', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)',
  borderBottom: '1px solid var(--border)',
};

function getRatingColor(val) {
  const n = parseFloat(val);
  if (n >= 7) return 'var(--green)';
  if (n >= 5) return 'var(--gold)';
  return 'var(--red-primary)';
}