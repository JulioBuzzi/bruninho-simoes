'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { matchesApi, playersApi, teamsApi, ratingsApi } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { Plus, LogOut, Save, Trash2, Pencil, X, ChevronDown, ChevronUp } from 'lucide-react';

const CHAMPIONSHIPS = ['Brasileirão','Carioca','Libertadores','Copa do Brasil','Supercopa','Recopa','Amistoso'];
const POSITIONS     = ['Goleiro','Zagueiro','Lateral Direito','Lateral Esquerdo','Volante','Meia','Atacante'];
const POSITION_SORT = {'Goleiro':1,'Lateral Direito':2,'Zagueiro':3,'Lateral Esquerdo':4,'Volante':5,'Meia':6,'Atacante':7};

function sortByPosition(players) {
  return [...players].sort((a,b) => {
    const pa = POSITION_SORT[a.position_in_match||a.position]??99;
    const pb = POSITION_SORT[b.position_in_match||b.position]??99;
    return pa !== pb ? pa-pb : (a.player_name||a.name||'').localeCompare(b.player_name||b.name||'');
  });
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser]         = useState(null);
  const [checking, setChecking] = useState(true);
  const [matches, setMatches]   = useState([]);
  const [players, setPlayers]   = useState([]);
  const [teams,   setTeams]     = useState([]);
  const [tab, setTab]           = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('bs_token');
    const u     = localStorage.getItem('bs_user');
    if (!token || !u) { router.push('/admin/login'); return; }
    const parsed = JSON.parse(u);
    setUser(parsed);
    setTab(parsed.role === 'admin' ? 'matches' : 'ratings');
    setChecking(false);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [m, p, t] = await Promise.all([matchesApi.getAll({ limit: 50 }), playersApi.getAll(), teamsApi.getAll()]);
      setMatches(m.data || []);
      setPlayers(p);
      setTeams(t);
    } catch { toast.error('Erro ao carregar dados'); }
  }, []);

  useEffect(() => { if (!checking) fetchData(); }, [checking, fetchData]);

  const handleLogout = () => { localStorage.removeItem('bs_token'); localStorage.removeItem('bs_user'); router.push('/admin/login'); };

  if (checking) return <div className="page-container" style={{ paddingTop: 40 }}><LoadingSpinner /></div>;

  const isAdmin = user?.role === 'admin';
  const allTabs = [
    { id: 'matches',  label: '⚽ Jogos',     roles: ['admin'] },
    { id: 'ratings',  label: '📝 Notas',     roles: ['admin','rater'] },
    { id: 'players',  label: '👤 Jogadores',  roles: ['admin'] },
    { id: 'teams',    label: '🏟️ Times',     roles: ['admin'] },
  ].filter(t => t.roles.includes(user?.role));

  return (
    <div className="page-container fade-in" style={{ paddingTop: 32, paddingBottom: 80 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:40 }}>{isAdmin ? <>Admin <span style={{color:'var(--red-primary)'}}>Panel</span></> : <>Painel de <span style={{color:'var(--red-primary)'}}>Notas</span></>}</h1>
          <p style={{ color:'var(--text-muted)', fontSize:13 }}>
            Logado como <strong style={{color:'var(--text-secondary)',textTransform:'capitalize'}}>{user?.username}</strong>
            <span className="badge badge-gray" style={{marginLeft:8,verticalAlign:'middle'}}>{isAdmin?'Admin':'Avaliador'}</span>
          </p>
        </div>
        <button className="btn btn-ghost" onClick={handleLogout}><LogOut size={16} /> Sair</button>
      </div>

      <div style={{ display:'flex', gap:4, marginBottom:28, borderBottom:'1px solid var(--border)' }}>
        {allTabs.map(({id,label}) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding:'10px 20px', background:'none', border:'none', cursor:'pointer',
            fontFamily:'Barlow Condensed', fontWeight:700, fontSize:14, letterSpacing:'0.05em', textTransform:'uppercase',
            color: tab===id ? 'var(--red-primary)' : 'var(--text-muted)',
            borderBottom: tab===id ? '2px solid var(--red-primary)' : '2px solid transparent',
            marginBottom:-1, transition:'all 0.2s',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'matches'  && isAdmin && <MatchesTab  matches={matches} teams={teams} players={players} onRefresh={fetchData} />}
      {tab === 'ratings'  &&           <RatingsTab  matches={matches} players={players} currentUser={user} onRefresh={fetchData} />}
      {tab === 'players'  && isAdmin && <PlayersTab  players={players} onRefresh={fetchData} />}
      {tab === 'teams'    && isAdmin && <TeamsTab    teams={teams}     onRefresh={fetchData} />}
    </div>
  );
}

/* ─── MATCHES TAB ─────────────────────────────────────────────────────────── */
function MatchesTab({ matches, teams, players, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ fontSize:28 }}>Gerenciar Jogos</h2>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); }}><Plus size={16} /> Novo Jogo</button>
      </div>

      {showForm && (
        <CreateMatchForm
          teams={teams} players={players.filter(p => p.active)}
          onDone={() => { setShowForm(false); onRefresh(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {matches.map(m => (
          <div key={m.id}>
            <div className="card" style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, marginBottom:2 }}>Flamengo {m.flamengo_goals} × {m.opponent_goals} {m.opponent_name}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{m.match_date?.slice(0,10)} • {m.championship} {m.season}</div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-ghost" onClick={() => setEditingId(editingId===m.id ? null : m.id)}
                  style={{ fontSize:12, padding:'6px 12px', color: editingId===m.id ? 'var(--gold)' : 'var(--text-muted)' }}>
                  <Pencil size={14} /> Editar
                </button>
                <Link href={`/jogos/${m.id}`} className="btn btn-ghost" style={{ fontSize:12, padding:'6px 12px' }}>Ver</Link>
                <button className="btn btn-ghost" onClick={async () => { if (!confirm('Apagar?')) return; try { await matchesApi.delete(m.id); toast.success('Removido'); onRefresh(); } catch { toast.error('Erro'); } }}
                  style={{ fontSize:12, padding:'6px 12px', color:'var(--red-primary)' }}><Trash2 size={14} /></button>
              </div>
            </div>
            {editingId === m.id && (
              <EditMatchPanel matchId={m.id} players={players.filter(p => p.active)}
                onDone={() => { setEditingId(null); onRefresh(); }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── CREATE MATCH FORM ───────────────────────────────────────────────────── */
function CreateMatchForm({ teams, players, onDone, onCancel }) {
  const empty = { match_date:'', championship:'Brasileirão', season:new Date().getFullYear(), opponent_id:'', flamengo_goals:0, opponent_goals:0, is_home:true, stadium:'', round:'', starters:[], goals:[], assists:[] };
  const [form, setForm]     = useState(empty);
  const [loading, setLoading] = useState(false);
  const addGoal    = () => setForm(p => ({ ...p, goals:   [...p.goals,   { player_id:'', minute:'', is_own_goal:false, is_penalty:false }] }));
  const removeGoal = i  => setForm(p => ({ ...p, goals:   p.goals.filter((_,idx) => idx!==i) }));
  const upGoal     = (i,f,v) => setForm(p => ({ ...p, goals:   p.goals.map((g,idx)   => idx===i ? {...g,[f]:v} : g) }));
  const addAssist    = () => setForm(p => ({ ...p, assists: [...p.assists, { player_id:'', minute:'' }] }));
  const removeAssist = i  => setForm(p => ({ ...p, assists: p.assists.filter((_,idx) => idx!==i) }));
  const upAssist   = (i,f,v) => setForm(p => ({ ...p, assists: p.assists.map((a,idx) => idx===i ? {...a,[f]:v} : a) }));

  const handleSubmit = async () => {
    if (!form.match_date || !form.opponent_id) { toast.error('Preencha data e adversário'); return; }
    setLoading(true);
    try {
      await matchesApi.create({ ...form, goals: form.goals.filter(g => g.player_id||g.is_own_goal), assists: form.assists.filter(a => a.player_id) });
      toast.success('Jogo criado!');
      onDone();
    } catch (err) { toast.error(err.response?.data?.error||'Erro ao criar jogo'); }
    finally { setLoading(false); }
  };


  return (
    <div className="card" style={{ marginBottom:24 }}>
      <h3 style={{ fontSize:22, marginBottom:20 }}>Cadastrar Jogo</h3>

      {/* Basic info */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16, marginBottom:24 }}>
        <div><label>Data *</label><input type="date" className="input" value={form.match_date} onChange={e => setForm(p=>({...p,match_date:e.target.value}))} /></div>
        <div><label>Campeonato</label>
          <select className="input" value={form.championship} onChange={e => setForm(p=>({...p,championship:e.target.value}))}>
            {CHAMPIONSHIPS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div><label>Temporada</label><input type="number" className="input" value={form.season} onChange={e => setForm(p=>({...p,season:e.target.value}))} /></div>
        <div><label>Adversário *</label>
          <select className="input" value={form.opponent_id} onChange={e => setForm(p=>({...p,opponent_id:e.target.value}))}>
            <option value="">Selecione...</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div><label>Gols Flamengo</label><input type="number" min="0" className="input" value={form.flamengo_goals} onChange={e => setForm(p=>({...p,flamengo_goals:parseInt(e.target.value)||0}))} /></div>
        <div><label>Gols Adversário</label><input type="number" min="0" className="input" value={form.opponent_goals} onChange={e => setForm(p=>({...p,opponent_goals:parseInt(e.target.value)||0}))} /></div>
        <div><label>Mandante</label>
          <select className="input" value={form.is_home?'true':'false'} onChange={e => setForm(p=>({...p,is_home:e.target.value==='true'}))}>
            <option value="true">Casa</option><option value="false">Fora</option>
          </select>
        </div>
        <div><label>Estádio</label><input className="input" value={form.stadium} onChange={e => setForm(p=>({...p,stadium:e.target.value}))} placeholder="Maracanã" /></div>
        <div><label>Rodada/Fase</label><input className="input" value={form.round} onChange={e => setForm(p=>({...p,round:e.target.value}))} placeholder="Rodada 1" /></div>
      </div>



      {/* Titulares */}
      <div style={{ paddingTop:20, borderTop:'1px solid var(--border)', marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <label style={{ margin:0 }}>Titulares</label>
          <span style={{ fontSize:12, color: form.starters.length===11 ? 'var(--green)' : 'var(--text-muted)' }}>{form.starters.length}/11</span>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {players.map(player => {
            const sel = form.starters.find(s => s.player_id === player.id);
            return (
              <button key={player.id} type="button" onClick={() => setForm(prev => {
                const exists = prev.starters.find(s => s.player_id === player.id);
                return { ...prev, starters: exists ? prev.starters.filter(s => s.player_id !== player.id) : [...prev.starters, { player_id: player.id, position: player.position }] };
              })} style={{ padding:'6px 14px', borderRadius:8, cursor:'pointer', background: sel ? 'var(--red-primary)' : 'var(--bg-secondary)', color: sel ? 'white' : 'var(--text-secondary)', fontFamily:'Barlow', fontSize:13, border: `1px solid ${sel ? 'var(--red-primary)' : 'var(--border)'}`, transition:'all 0.15s' }}>
                {player.number ? `#${player.number} ` : ''}{player.name}
              </button>
            );
          })}
        </div>
      </div>

      <GoalsAssistsForm
        goals={form.goals} assists={form.assists} players={players}
        addGoal={addGoal} removeGoal={removeGoal} updateGoal={upGoal}
        addAssist={addAssist} removeAssist={removeAssist} updateAssist={upAssist}
      />

      <div style={{ display:'flex', gap:12, marginTop:20 }}>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}><Save size={16} />{loading?'Salvando...':'Criar Jogo'}</button>
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

/* ─── EDIT MATCH PANEL ────────────────────────────────────────────────────── */
function EditMatchPanel({ matchId, players, onDone }) {
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [score,    setScore]    = useState({ flamengo_goals:0, opponent_goals:0 });
  const [starters, setStarters] = useState([]);
  const [goals,    setGoals]    = useState([]);
  const [assists,  setAssists]  = useState([]);

  useEffect(() => {
    matchesApi.getById(matchId).then(d => {
      setScore({ flamengo_goals: d.match.flamengo_goals, opponent_goals: d.match.opponent_goals });
      // Load existing starters as array of player_ids
      setStarters(d.players.map(p => ({ player_id: p.player_id, position: p.position_in_match || p.position })));
      setGoals(d.goals.map(g => ({ player_id: g.player_id||'', minute: g.minute||'', is_own_goal: g.is_own_goal||false, is_penalty: g.is_penalty||false })));
      setAssists(d.assists.map(a => ({ player_id: a.player_id||'', minute: a.minute||'' })));
    }).finally(() => setLoading(false));
  }, [matchId]);

  const toggleStarter = (player) => {
    setStarters(prev => {
      const exists = prev.find(s => s.player_id === player.id);
      if (exists) return prev.filter(s => s.player_id !== player.id);
      return [...prev, { player_id: player.id, position: player.position }];
    });
  };

  const addGoal    = () => setGoals(p  => [...p,  { player_id:'', minute:'', is_own_goal:false, is_penalty:false }]);
  const removeGoal = i  => setGoals(p  => p.filter((_,idx) => idx!==i));
  const upGoal     = (i,f,v) => setGoals(p  => p.map((g,idx) => idx===i ? {...g,[f]:v} : g));
  const addAssist    = () => setAssists(p => [...p,  { player_id:'', minute:'' }]);
  const removeAssist = i  => setAssists(p => p.filter((_,idx) => idx!==i));
  const upAssist   = (i,f,v) => setAssists(p => p.map((a,idx) => idx===i ? {...a,[f]:v} : a));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        flamengo_goals: parseInt(score.flamengo_goals) || 0,
        opponent_goals: parseInt(score.opponent_goals) || 0,
        starters,
        goals:   goals.filter(g => g.player_id || g.is_own_goal),
        assists: assists.filter(a => a.player_id),
      };
      console.log('[EditMatchPanel] Enviando para API:', JSON.stringify(payload).slice(0, 300));
      const result = await matchesApi.updateGoalsAssists(matchId, payload);
      console.log('[EditMatchPanel] Resposta da API:', result);
      toast.success('Jogo atualizado!');
      onDone();
    } catch (err) {
      console.error('[EditMatchPanel] Erro:', err.response?.data || err.message);
      toast.error('Erro ao salvar: ' + (err.response?.data?.error || err.message));
    }
    finally { setSaving(false); }
  };

  if (loading) return <div className="card" style={{ marginTop:4 }}><LoadingSpinner text="Carregando..." /></div>;

  return (
    <div className="card" style={{ marginTop:4, borderColor:'rgba(245,200,66,0.25)', background:'rgba(245,200,66,0.03)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h4 style={{ fontFamily:'Bebas Neue', fontSize:22, color:'var(--gold)' }}>✏️ Editar Jogo</h4>
        <button onClick={onDone} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><X size={18} /></button>
      </div>

      {/* Score */}
      <div style={{ display:'flex', gap:16, marginBottom:24, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:120 }}>
          <label>Gols Flamengo</label>
          <input type="number" min="0" className="input" value={score.flamengo_goals}
            onChange={e => setScore(p => ({...p, flamengo_goals: e.target.value}))} />
        </div>
        <div style={{ flex:1, minWidth:120 }}>
          <label>Gols Adversário</label>
          <input type="number" min="0" className="input" value={score.opponent_goals}
            onChange={e => setScore(p => ({...p, opponent_goals: e.target.value}))} />
        </div>
      </div>

      {/* Starters editor */}
      <div style={{ paddingTop:20, borderTop:'1px solid var(--border)', marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <label style={{ margin:0 }}>👕 Escalação</label>
          <span style={{ fontSize:12, color: starters.length===11 ? 'var(--green)' : 'var(--text-muted)' }}>
            {starters.length}/11 selecionados
          </span>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {players.filter(p => p.active).map(player => {
            const sel = starters.find(s => s.player_id === player.id);
            return (
              <button key={player.id} type="button" onClick={() => toggleStarter(player)} style={{
                padding:'6px 14px', borderRadius:8, cursor:'pointer',
                background: sel ? 'var(--gold)' : 'var(--bg-secondary)',
                color: sel ? '#000' : 'var(--text-secondary)',
                fontFamily:'Barlow', fontSize:13, fontWeight: sel ? 600 : 400,
                border: `1px solid ${sel ? 'var(--gold)' : 'var(--border)'}`,
                transition:'all 0.15s',
              }}>
                {player.number ? `#${player.number} ` : ''}{player.name}
              </button>
            );
          })}
        </div>
      </div>

      <GoalsAssistsForm
        goals={goals} assists={assists} players={players.filter(p => p.active)}
        addGoal={addGoal} removeGoal={removeGoal} updateGoal={upGoal}
        addAssist={addAssist} removeAssist={removeAssist} updateAssist={upAssist}
      />

      <div style={{ display:'flex', gap:12, marginTop:20 }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}><Save size={16} />{saving?'Salvando...':'Salvar'}</button>
        <button className="btn btn-ghost" onClick={onDone}>Cancelar</button>
      </div>
    </div>
  );
}

/* ─── GOALS/ASSISTS FORM ──────────────────────────────────────────────────── */
function GoalsAssistsForm({ goals, assists, players, addGoal, removeGoal, updateGoal, addAssist, removeAssist, updateAssist }) {
  return (
    <>
      <div style={{ marginBottom:24, paddingTop:20, borderTop:'1px solid var(--border)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <label style={{ margin:0 }}>⚽ Gols do Flamengo</label>
          <button type="button" className="btn btn-ghost" style={{ fontSize:12, padding:'4px 12px' }} onClick={addGoal}><Plus size={14} /> Adicionar</button>
        </div>
        {goals.length === 0 && <p style={{ fontSize:12, color:'var(--text-muted)' }}>Nenhum gol adicionado.</p>}
        {goals.map((g, i) => (
          <div key={i} style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10, flexWrap:'wrap' }}>
            <div style={{ flex:2, minWidth:160 }}>
              <select className="input" value={g.player_id} onChange={e => updateGoal(i,'player_id',e.target.value)}>
                <option value="">Gol Contra</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ width:80 }}><input type="number" className="input" placeholder="Min." min="1" max="120" value={g.minute} onChange={e => updateGoal(i,'minute',e.target.value)} /></div>
            <label style={{ display:'flex', alignItems:'center', gap:6, margin:0, cursor:'pointer', fontSize:13, color:'var(--text-secondary)', textTransform:'none', letterSpacing:0 }}>
              <input type="checkbox" checked={g.is_penalty} onChange={e => updateGoal(i,'is_penalty',e.target.checked)} /> Pênalti
            </label>
            <button type="button" onClick={() => removeGoal(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--red-primary)', padding:4 }}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
      <div style={{ paddingTop:20, borderTop:'1px solid var(--border)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <label style={{ margin:0 }}>🎯 Assistências</label>
          <button type="button" className="btn btn-ghost" style={{ fontSize:12, padding:'4px 12px' }} onClick={addAssist}><Plus size={14} /> Adicionar</button>
        </div>
        {assists.length === 0 && <p style={{ fontSize:12, color:'var(--text-muted)' }}>Nenhuma assistência adicionada.</p>}
        {assists.map((a, i) => (
          <div key={i} style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10, flexWrap:'wrap' }}>
            <div style={{ flex:2, minWidth:160 }}>
              <select className="input" value={a.player_id} onChange={e => updateAssist(i,'player_id',e.target.value)}>
                <option value="">Selecione...</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ width:80 }}><input type="number" className="input" placeholder="Min." min="1" max="120" value={a.minute} onChange={e => updateAssist(i,'minute',e.target.value)} /></div>
            <button type="button" onClick={() => removeAssist(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--red-primary)', padding:4 }}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── RATINGS TAB ─────────────────────────────────────────────────────────── */
function RatingsTab({ matches, players, currentUser, onRefresh }) {
  const [selectedMatch, setSelectedMatch] = useState('');
  const [matchData,     setMatchData]     = useState(null);
  const [ratings,       setRatings]       = useState({});
  const [loading,       setLoading]       = useState(false);
  const [saving,        setSaving]        = useState(false);

  const loadMatch = async (matchId) => {
    if (!matchId) return;
    setLoading(true);
    try {
      const data = await matchesApi.getById(matchId);
      setMatchData(data);
      const r = {};
      data.players.forEach(p => { r[p.player_id] = { bruninho: p.bruninho_rating??'', simoes: p.simoes_rating??'' }; });
      setRatings(r);
    } catch { toast.error('Erro ao carregar jogo'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!selectedMatch) return;
    setSaving(true);
    try {
      const list = Object.entries(ratings).map(([player_id, r]) => ({
        player_id,
        bruninho_rating: r.bruninho !== '' ? parseFloat(r.bruninho) : null,
        simoes_rating:   r.simoes   !== '' ? parseFloat(r.simoes)   : null,
      })).filter(r => r.bruninho_rating!==null||r.simoes_rating!==null);
      await ratingsApi.save({ match_id: selectedMatch, ratings: list });
      toast.success('Notas salvas!');
      onRefresh();
    } catch { toast.error('Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const m = matchData?.match;

  return (
    <div>
      <h2 style={{ fontSize:28, marginBottom:20 }}>Inserir Notas</h2>

      <div style={{ display:'flex', gap:16, alignItems:'flex-end', marginBottom:24, flexWrap:'wrap' }}>
        <div style={{ minWidth:300, flex:1 }}>
          <label>Selecione o Jogo</label>
          <select className="input" value={selectedMatch} onChange={e => { setSelectedMatch(e.target.value); loadMatch(e.target.value); }}>
            <option value="">Selecione...</option>
            {matches.map(m => (
              <option key={m.id} value={m.id}>{m.match_date?.slice(0,10)} • FLA {m.flamengo_goals}×{m.opponent_goals} {m.opponent_name} ({m.championship})</option>
            ))}
          </select>
        </div>
        {selectedMatch && <button className="btn btn-primary" onClick={handleSave} disabled={saving}><Save size={16} />{saving?'Salvando...':'Salvar Notas'}</button>}
      </div>

      {loading && <LoadingSpinner text="Carregando titulares..." />}

      {matchData && !loading && (
        <>
          <div style={{ background:'var(--bg-secondary)', borderRadius:12, padding:'12px 16px', marginBottom:20, display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontFamily:'Bebas Neue', fontSize:20 }}>FLA {m.flamengo_goals} × {m.opponent_goals} {m.opponent_name}</span>
            <span className="badge badge-gray">{m.championship}</span>
            <span style={{ fontSize:13, color:'var(--text-muted)' }}>{m.match_date?.slice(0,10)}</span>
          </div>

          {matchData.players.length === 0 ? (
            <div className="card" style={{ textAlign:'center', color:'var(--text-muted)', padding:40 }}>
              Jogo sem titulares cadastrados. Use a aba de Jogos para editar a escalação.
            </div>
          ) : (
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'var(--bg-secondary)' }}>
                    <th style={thStyle}>Jogador</th>
                    <th style={{...thStyle, textAlign:'center'}}>Pos.</th>
                    <th style={{...thStyle, textAlign:'center', color:'var(--red-primary)'}}>🎤 Simões (0-10)</th>
                    <th style={{...thStyle, textAlign:'center', color:'#448aff'}}>🎙️ Bruninho (0-10)</th>
                    <th style={{...thStyle, textAlign:'center'}}>Média</th>
                  </tr>
                </thead>
                <tbody>
                  {sortByPosition(matchData.players).map((player, i) => {
                    const r   = ratings[player.player_id] || { bruninho:'', simoes:'' };
                    const both = r.bruninho!==''&&r.simoes!=='';
                    const avg = both ? ((parseFloat(r.bruninho)+parseFloat(r.simoes))/2).toFixed(2)
                      : r.bruninho!=='' ? parseFloat(r.bruninho).toFixed(1)
                      : r.simoes!==''   ? parseFloat(r.simoes).toFixed(1) : '—';
                    return (
                      <tr key={player.player_id} style={{ borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'rgba(255,255,255,0.01)' }}>
                        <td style={{ padding:'12px 16px', fontWeight:600 }}>
                          {player.number && <span style={{ color:'var(--text-muted)', marginRight:8, fontFamily:'Barlow Condensed' }}>#{player.number}</span>}
                          {player.player_name}
                        </td>
                        <td style={{ padding:'12px 16px', textAlign:'center', fontSize:12, color:'var(--text-muted)', fontFamily:'Barlow Condensed' }}>{player.position}</td>
                        <td style={{ padding:'8px 16px', textAlign:'center' }}>
                          <input type="number" min="0" max="10" step="0.5" className="input"
                            value={r.simoes}
                            onChange={e => setRatings(prev => ({ ...prev, [player.player_id]: { ...prev[player.player_id], simoes: e.target.value } }))}
                            style={{ width:80, textAlign:'center', margin:'0 auto' }} placeholder="—" />
                        </td>
                        <td style={{ padding:'8px 16px', textAlign:'center' }}>
                          <input type="number" min="0" max="10" step="0.5" className="input"
                            value={r.bruninho}
                            onChange={e => setRatings(prev => ({ ...prev, [player.player_id]: { ...prev[player.player_id], bruninho: e.target.value } }))}
                            style={{ width:80, textAlign:'center', margin:'0 auto' }} placeholder="—" />
                        </td>
                        <td style={{ padding:'12px 16px', textAlign:'center', fontFamily:'Bebas Neue', fontSize:20, color:avg!=='—'?getRatingColor(avg):'var(--text-muted)' }}>{avg}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {matchData.players.length > 0 && (
            <div style={{ marginTop:20 }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}><Save size={16} />{saving?'Salvando...':'Salvar Todas as Notas'}</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── PLAYERS TAB ─────────────────────────────────────────────────────────── */
function PlayersTab({ players, onRefresh }) {
  const empty = { name:'', position:'Atacante', number:'', photo_url:'' };
  const [form, setForm] = useState(empty);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!form.name) { toast.error('Nome é obrigatório'); return; }
    setLoading(true);
    try { await playersApi.create(form); toast.success('Jogador criado!'); setForm(empty); setShow(false); onRefresh(); }
    catch { toast.error('Erro'); } finally { setLoading(false); }
  };
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
        <h2 style={{ fontSize:28 }}>Jogadores</h2>
        <button className="btn btn-primary" onClick={() => setShow(!show)}><Plus size={16} /> Novo</button>
      </div>
      {show && (
        <div className="card" style={{ marginBottom:24 }}>
          <h3 style={{ fontSize:22, marginBottom:16 }}>Cadastrar Jogador</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16 }}>
            <div><label>Nome</label><input className="input" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} /></div>
            <div><label>Posição</label><select className="input" value={form.position} onChange={e => setForm(p=>({...p,position:e.target.value}))}>{POSITIONS.map(pos => <option key={pos}>{pos}</option>)}</select></div>
            <div><label>Número</label><input type="number" className="input" value={form.number} onChange={e => setForm(p=>({...p,number:e.target.value}))} /></div>
            <div><label>Foto URL</label><input className="input" value={form.photo_url} onChange={e => setForm(p=>({...p,photo_url:e.target.value}))} placeholder="/players/nome.png" /></div>
          </div>
          <div style={{ display:'flex', gap:12, marginTop:16 }}>
            <button className="btn btn-primary" onClick={submit} disabled={loading}><Save size={16} /> Salvar</button>
            <button className="btn btn-ghost" onClick={() => setShow(false)}>Cancelar</button>
          </div>
        </div>
      )}
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {players.map(p => (
          <div key={p.id} className="card" style={{ display:'flex', alignItems:'center', gap:12, opacity:p.active?1:0.5 }}>
            <div style={{ width:36, height:36, borderRadius:8, overflow:'hidden', background:'var(--bg-secondary)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Bebas Neue', fontSize:14, color:'var(--text-muted)', flexShrink:0 }}>
              {p.photo_url ? <img src={p.photo_url} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{e.target.style.display='none';}} /> : (p.number||'?')}
            </div>
            <div style={{ flex:1 }}><div style={{ fontWeight:600 }}>{p.name}</div><div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'Barlow Condensed' }}>{p.position}</div></div>
            <button onClick={async () => { try { await playersApi.update(p.id,{active:!p.active}); toast.success(`${p.name} ${!p.active?'ativado':'desativado'}`); onRefresh(); } catch { toast.error('Erro'); } }}
              className="btn btn-ghost" style={{ fontSize:12, padding:'5px 12px', color:p.active?'var(--green)':'var(--text-muted)' }}>
              {p.active?'Ativo':'Inativo'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── TEAMS TAB ───────────────────────────────────────────────────────────── */
function TeamsTab({ teams, onRefresh }) {
  const empty = { name:'', short_name:'', logo_url:'', state:'', country:'Brasil' };
  const [form, setForm] = useState(empty);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!form.name) { toast.error('Nome é obrigatório'); return; }
    setLoading(true);
    try { await teamsApi.create(form); toast.success('Time criado!'); setForm(empty); setShow(false); onRefresh(); }
    catch { toast.error('Erro'); } finally { setLoading(false); }
  };
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
        <h2 style={{ fontSize:28 }}>Times</h2>
        <button className="btn btn-primary" onClick={() => setShow(!show)}><Plus size={16} /> Novo</button>
      </div>
      {show && (
        <div className="card" style={{ marginBottom:24 }}>
          <h3 style={{ fontSize:22, marginBottom:16 }}>Cadastrar Time</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16 }}>
            <div><label>Nome</label><input className="input" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} /></div>
            <div><label>Abreviação</label><input className="input" value={form.short_name} onChange={e => setForm(p=>({...p,short_name:e.target.value}))} maxLength={5} /></div>
            <div><label>Logo URL</label><input className="input" value={form.logo_url} onChange={e => setForm(p=>({...p,logo_url:e.target.value}))} /></div>
            <div><label>Estado</label><input className="input" value={form.state} onChange={e => setForm(p=>({...p,state:e.target.value}))} /></div>
            <div><label>País</label><input className="input" value={form.country} onChange={e => setForm(p=>({...p,country:e.target.value}))} /></div>
          </div>
          <div style={{ display:'flex', gap:12, marginTop:16 }}>
            <button className="btn btn-primary" onClick={submit} disabled={loading}><Save size={16} /> Salvar</button>
            <button className="btn btn-ghost" onClick={() => setShow(false)}>Cancelar</button>
          </div>
        </div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10 }}>
        {teams.map(t => (
          <div key={t.id} className="card" style={{ display:'flex', alignItems:'center', gap:12 }}>
            {t.logo_url ? <img src={t.logo_url} alt={t.name} style={{ width:36, height:36, objectFit:'contain' }} /> : (
              <div style={{ width:36, height:36, borderRadius:8, background:'var(--bg-secondary)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Bebas Neue', fontSize:12, color:'var(--text-muted)' }}>{t.short_name||t.name.slice(0,3).toUpperCase()}</div>
            )}
            <div><div style={{ fontWeight:600, fontSize:14 }}>{t.name}</div>{t.state&&<div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'Barlow Condensed' }}>{t.state}</div>}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const thStyle = { padding:'12px 16px', textAlign:'left', fontSize:11, fontFamily:'Barlow Condensed', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)', borderBottom:'1px solid var(--border)' };
function getRatingColor(val) { const n=parseFloat(val); if(n>=7)return'var(--green)'; if(n>=5)return'var(--gold)'; return'var(--red-primary)'; }