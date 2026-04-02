const { query } = require('../config/database');

const getMatches = async (req, res) => {
  try {
    const { championship, season, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];
    if (championship) { params.push(championship); conditions.push(`m.championship = $${params.length}`); }
    if (season) { params.push(parseInt(season)); conditions.push(`m.season = $${params.length}`); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT m.*, t.name AS opponent_name, t.short_name AS opponent_short, t.logo_url AS opponent_logo,
        COALESCE(mh.mvp_name,'') AS mvp_name, COALESCE(mh.mvp_rating,0) AS mvp_rating,
        COALESCE(mh.bagre_name,'') AS bagre_name, COALESCE(mh.bagre_rating,0) AS bagre_rating,
        COALESCE(mh.team_avg,0) AS team_avg, COUNT(mp.id) AS starters_count
      FROM matches m JOIN teams t ON t.id = m.opponent_id
      LEFT JOIN match_highlights mh ON mh.match_id = m.id
      LEFT JOIN match_players mp ON mp.match_id = m.id AND mp.is_starter = TRUE
      ${where}
      GROUP BY m.id, t.name, t.short_name, t.logo_url, mh.mvp_name, mh.mvp_rating, mh.bagre_name, mh.bagre_rating, mh.team_avg
      ORDER BY m.match_date DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    const result = await query(sql, params);
    const countParams = conditions.length ? params.slice(0, conditions.length) : [];
    const countResult = await query(`SELECT COUNT(*) FROM matches m ${where}`, countParams);
    res.json({ data: result.rows, pagination: { total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(countResult.rows[0].count / limit) } });
  } catch (error) { console.error('getMatches error:', error); res.status(500).json({ error: 'Erro ao buscar jogos' }); }
};

const getMatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const matchResult = await query(`
      SELECT m.*, t.name AS opponent_name, t.short_name AS opponent_short, t.logo_url AS opponent_logo
      FROM matches m JOIN teams t ON t.id = m.opponent_id WHERE m.id = $1`, [id]);
    if (!matchResult.rows[0]) return res.status(404).json({ error: 'Jogo não encontrado' });
    const match = matchResult.rows[0];
    const ratingsResult = await query(`
      SELECT p.id AS player_id, p.name AS player_name, p.position, p.number, p.photo_url,
        mp.position_in_match, r.bruninho_rating, r.simoes_rating, r.average_rating,
        CASE WHEN r.average_rating >= 7 THEN 'craque' WHEN r.average_rating <= 4 THEN 'bagre' ELSE 'normal' END AS tag
      FROM match_players mp JOIN players p ON p.id = mp.player_id
      LEFT JOIN ratings r ON r.match_id = mp.match_id AND r.player_id = mp.player_id
      WHERE mp.match_id = $1 AND mp.is_starter = TRUE
      ORDER BY CASE p.position WHEN 'Goleiro' THEN 1 WHEN 'Zagueiro' THEN 2 WHEN 'Lateral Direito' THEN 3 WHEN 'Lateral Esquerdo' THEN 4 WHEN 'Volante' THEN 5 WHEN 'Meia' THEN 6 WHEN 'Atacante' THEN 7 ELSE 8 END, p.name`, [id]);
    const goalsResult   = await query(`SELECT g.*, p.name AS player_name FROM goals g LEFT JOIN players p ON p.id = g.player_id WHERE g.match_id = $1 ORDER BY g.minute`, [id]);
    const assistsResult = await query(`SELECT a.*, p.name AS player_name FROM assists a JOIN players p ON p.id = a.player_id WHERE a.match_id = $1 ORDER BY a.minute`, [id]);
    const players = ratingsResult.rows;
    const rated = players.filter(p => p.average_rating !== null);
    const mvp   = rated.length ? rated.reduce((a, b) => a.average_rating > b.average_rating ? a : b) : null;
    const bagre = rated.length ? rated.reduce((a, b) => a.average_rating < b.average_rating ? a : b) : null;
    const teamAvg = rated.length ? rated.reduce((s, p) => s + parseFloat(p.average_rating), 0) / rated.length : 0;
    const brunAvg = rated.filter(p => p.bruninho_rating).length ? rated.filter(p => p.bruninho_rating).reduce((s, p) => s + parseFloat(p.bruninho_rating), 0) / rated.filter(p => p.bruninho_rating).length : 0;
    const simAvg  = rated.filter(p => p.simoes_rating).length  ? rated.filter(p => p.simoes_rating).reduce((s,  p) => s + parseFloat(p.simoes_rating), 0)  / rated.filter(p => p.simoes_rating).length  : 0;
    res.json({ match, players, goals: goalsResult.rows, assists: assistsResult.rows, highlights: { mvp, bagre, team_avg: parseFloat(teamAvg.toFixed(2)), bruninho_avg: parseFloat(brunAvg.toFixed(2)), simoes_avg: parseFloat(simAvg.toFixed(2)) } });
  } catch (error) { console.error('getMatchById error:', error); res.status(500).json({ error: 'Erro ao buscar jogo' }); }
};

const createMatch = async (req, res) => {
  try {
    const { match_date, championship, season, opponent_id, flamengo_goals, opponent_goals, is_home, stadium, round, notes, starters, goals, assists } = req.body;
    if (!match_date || !opponent_id) return res.status(400).json({ error: 'match_date e opponent_id são obrigatórios' });
    const matchResult = await query(`
      INSERT INTO matches (match_date, championship, season, opponent_id, flamengo_goals, opponent_goals, is_home, stadium, round, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [match_date, championship || 'Brasileirão', season || new Date().getFullYear(), opponent_id,
       flamengo_goals ?? 0, opponent_goals ?? 0, is_home !== false, stadium, round, notes]);
    const match = matchResult.rows[0];
    if (starters?.length) for (const s of starters) await query(`INSERT INTO match_players (match_id, player_id, is_starter, position_in_match) VALUES ($1,$2,TRUE,$3) ON CONFLICT DO NOTHING`, [match.id, s.player_id, s.position]);
    if (goals?.length)   for (const g of goals)   if (g.player_id || g.is_own_goal) await query(`INSERT INTO goals (match_id, player_id, minute, is_own_goal, is_penalty) VALUES ($1,$2,$3,$4,$5)`, [match.id, g.player_id||null, g.minute||null, g.is_own_goal||false, g.is_penalty||false]);
    if (assists?.length) for (const a of assists)  if (a.player_id) await query(`INSERT INTO assists (match_id, player_id, minute) VALUES ($1,$2,$3)`, [match.id, a.player_id, a.minute||null]);
    res.status(201).json({ message: 'Jogo criado', match });
  } catch (error) { console.error('createMatch error:', error); res.status(500).json({ error: 'Erro ao criar jogo' }); }
};

const updateMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { match_date, championship, season, opponent_id, flamengo_goals, opponent_goals, is_home, stadium, round, notes } = req.body;
    const result = await query(`
      UPDATE matches SET match_date=COALESCE($1,match_date), championship=COALESCE($2,championship),
        season=COALESCE($3,season), opponent_id=COALESCE($4,opponent_id),
        flamengo_goals=COALESCE($5,flamengo_goals), opponent_goals=COALESCE($6,opponent_goals),
        is_home=COALESCE($7,is_home), stadium=COALESCE($8,stadium), round=COALESCE($9,round),
        notes=COALESCE($10,notes), updated_at=NOW()
      WHERE id=$11 RETURNING *`,
      [match_date, championship, season, opponent_id, flamengo_goals, opponent_goals, is_home, stadium, round, notes, id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Jogo não encontrado' });
    res.json({ message: 'Jogo atualizado', match: result.rows[0] });
  } catch (error) { console.error('updateMatch error:', error); res.status(500).json({ error: 'Erro ao atualizar jogo' }); }
};

// PUT /matches/:id/goals-assists
// Atualiza placar, escalação, gols e assistências de um jogo existente
const updateMatchGoalsAssists = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[updateMatchGoalsAssists] Recebido para match ${id}:`, JSON.stringify(req.body).slice(0, 200));

    const { goals, assists, flamengo_goals, opponent_goals, starters } = req.body;

    // Verificar se o jogo existe
    const matchCheck = await query('SELECT id FROM matches WHERE id = $1', [id]);
    if (!matchCheck.rows[0]) {
      return res.status(404).json({ error: 'Jogo não encontrado' });
    }

    // Atualizar placar sempre (mesmo que seja 0)
    await query(
      `UPDATE matches SET flamengo_goals = $1, opponent_goals = $2, updated_at = NOW() WHERE id = $3`,
      [parseInt(flamengo_goals) || 0, parseInt(opponent_goals) || 0, id]
    );
    console.log(`[updateMatchGoalsAssists] Placar atualizado: ${flamengo_goals} x ${opponent_goals}`);

    // Atualizar escalação se enviada
    if (Array.isArray(starters)) {
      await query('DELETE FROM match_players WHERE match_id = $1', [id]);
      for (const s of starters) {
        if (s.player_id) {
          await query(
            `INSERT INTO match_players (match_id, player_id, is_starter, position_in_match) VALUES ($1, $2, TRUE, $3)`,
            [id, s.player_id, s.position || null]
          );
        }
      }
      console.log(`[updateMatchGoalsAssists] Escalação: ${starters.length} jogadores`);
    }

    // Substituir gols
    await query('DELETE FROM goals WHERE match_id = $1', [id]);
    if (Array.isArray(goals)) {
      for (const g of goals) {
        if (g.player_id || g.is_own_goal) {
          await query(
            `INSERT INTO goals (match_id, player_id, minute, is_own_goal, is_penalty) VALUES ($1, $2, $3, $4, $5)`,
            [id, g.player_id || null, g.minute || null, g.is_own_goal || false, g.is_penalty || false]
          );
        }
      }
      console.log(`[updateMatchGoalsAssists] Gols: ${goals.length}`);
    }

    // Substituir assistências
    await query('DELETE FROM assists WHERE match_id = $1', [id]);
    if (Array.isArray(assists)) {
      for (const a of assists) {
        if (a.player_id) {
          await query(
            `INSERT INTO assists (match_id, player_id, minute) VALUES ($1, $2, $3)`,
            [id, a.player_id, a.minute || null]
          );
        }
      }
      console.log(`[updateMatchGoalsAssists] Assistências: ${assists.length}`);
    }

    res.json({ message: 'Jogo atualizado com sucesso' });
  } catch (error) {
    console.error('[updateMatchGoalsAssists] ERRO:', error);
    res.status(500).json({ error: 'Erro ao atualizar jogo: ' + error.message });
  }
};

const deleteMatch = async (req, res) => {
  try {
    const result = await query('DELETE FROM matches WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Jogo não encontrado' });
    res.json({ message: 'Jogo deletado' });
  } catch (error) { res.status(500).json({ error: 'Erro ao deletar jogo' }); }
};

const getSeasons       = async (req, res) => { try { const r = await query('SELECT DISTINCT season FROM matches ORDER BY season DESC'); res.json(r.rows.map(r => r.season)); } catch { res.status(500).json({ error: 'Erro' }); } };
const getChampionships = async (req, res) => { try { const r = await query('SELECT DISTINCT championship FROM matches ORDER BY championship'); res.json(r.rows.map(r => r.championship)); } catch { res.status(500).json({ error: 'Erro' }); } };

module.exports = { getMatches, getMatchById, createMatch, updateMatch, deleteMatch, getSeasons, getChampionships, updateMatchGoalsAssists };