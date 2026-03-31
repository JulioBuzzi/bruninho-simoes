const { query } = require('../config/database');

// GET /matches - Listar jogos com filtros
const getMatches = async (req, res) => {
  try {
    const { championship, season, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];

    if (championship) {
      params.push(championship);
      conditions.push(`m.championship = $${params.length}`);
    }
    if (season) {
      params.push(parseInt(season));
      conditions.push(`m.season = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT
        m.*,
        t.name AS opponent_name,
        t.short_name AS opponent_short,
        t.logo_url AS opponent_logo,
        COALESCE(mh.mvp_name, '') AS mvp_name,
        COALESCE(mh.mvp_rating, 0) AS mvp_rating,
        COALESCE(mh.bagre_name, '') AS bagre_name,
        COALESCE(mh.bagre_rating, 0) AS bagre_rating,
        COALESCE(mh.team_avg, 0) AS team_avg,
        COUNT(mp.id) AS starters_count
      FROM matches m
      JOIN teams t ON t.id = m.opponent_id
      LEFT JOIN match_highlights mh ON mh.match_id = m.id
      LEFT JOIN match_players mp ON mp.match_id = m.id AND mp.is_starter = TRUE
      ${where}
      GROUP BY m.id, t.name, t.short_name, t.logo_url, mh.mvp_name, mh.mvp_rating, mh.bagre_name, mh.bagre_rating, mh.team_avg
      ORDER BY m.match_date DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);
    const result = await query(sql, params);

    // Count total
    const countParams = conditions.length ? params.slice(0, conditions.length) : [];
    const countSql = `SELECT COUNT(*) FROM matches m ${where}`;
    const countResult = await query(countSql, countParams);

    res.json({
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar jogos:', error);
    res.status(500).json({ error: 'Erro ao buscar jogos' });
  }
};

// GET /matches/:id - Detalhes de um jogo
const getMatchById = async (req, res) => {
  try {
    const { id } = req.params;

    const matchResult = await query(`
      SELECT
        m.*,
        t.name AS opponent_name,
        t.short_name AS opponent_short,
        t.logo_url AS opponent_logo
      FROM matches m
      JOIN teams t ON t.id = m.opponent_id
      WHERE m.id = $1
    `, [id]);

    if (!matchResult.rows[0]) {
      return res.status(404).json({ error: 'Jogo não encontrado' });
    }

    const match = matchResult.rows[0];

    // Buscar jogadores titulares com notas
    const ratingsResult = await query(`
      SELECT
        p.id AS player_id,
        p.name AS player_name,
        p.position,
        p.number,
        p.photo_url,
        mp.position_in_match,
        r.bruninho_rating,
        r.simoes_rating,
        r.average_rating,
        CASE
          WHEN r.average_rating >= 7 THEN 'craque'
          WHEN r.average_rating <= 4 THEN 'bagre'
          ELSE 'normal'
        END AS tag
      FROM match_players mp
      JOIN players p ON p.id = mp.player_id
      LEFT JOIN ratings r ON r.match_id = mp.match_id AND r.player_id = mp.player_id
      WHERE mp.match_id = $1 AND mp.is_starter = TRUE
      ORDER BY
        CASE p.position
          WHEN 'Goleiro' THEN 1
          WHEN 'Zagueiro' THEN 2
          WHEN 'Lateral Direito' THEN 3
          WHEN 'Lateral Esquerdo' THEN 4
          WHEN 'Volante' THEN 5
          WHEN 'Meia' THEN 6
          WHEN 'Atacante' THEN 7
          ELSE 8
        END, p.name
    `, [id]);

    // Buscar gols
    const goalsResult = await query(`
      SELECT g.*, p.name AS player_name
      FROM goals g
      LEFT JOIN players p ON p.id = g.player_id
      WHERE g.match_id = $1
      ORDER BY g.minute
    `, [id]);

    // Buscar assistências
    const assistsResult = await query(`
      SELECT a.*, p.name AS player_name
      FROM assists a
      JOIN players p ON p.id = a.player_id
      WHERE a.match_id = $1
      ORDER BY a.minute
    `, [id]);

    // Highlights
    const players = ratingsResult.rows;
    const rated = players.filter(p => p.average_rating !== null);
    const mvp = rated.length ? rated.reduce((a, b) => a.average_rating > b.average_rating ? a : b) : null;
    const bagre = rated.length ? rated.reduce((a, b) => a.average_rating < b.average_rating ? a : b) : null;
    const teamAvg = rated.length ? rated.reduce((sum, p) => sum + parseFloat(p.average_rating), 0) / rated.length : 0;

    const bruninhAvg = rated.length ? rated.reduce((sum, p) => sum + (parseFloat(p.bruninho_rating) || 0), 0) / rated.filter(p => p.bruninho_rating).length : 0;
    const simoesAvg = rated.length ? rated.reduce((sum, p) => sum + (parseFloat(p.simoes_rating) || 0), 0) / rated.filter(p => p.simoes_rating).length : 0;

    res.json({
      match,
      players: ratingsResult.rows,
      goals: goalsResult.rows,
      assists: assistsResult.rows,
      highlights: {
        mvp,
        bagre,
        team_avg: parseFloat(teamAvg.toFixed(2)),
        bruninho_avg: parseFloat(bruninhAvg.toFixed(2)),
        simoes_avg: parseFloat(simoesAvg.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar jogo:', error);
    res.status(500).json({ error: 'Erro ao buscar jogo' });
  }
};

// POST /matches - Criar jogo
const createMatch = async (req, res) => {
  try {
    const {
      match_date, championship, season, opponent_id,
      flamengo_goals, opponent_goals, is_home,
      stadium, round, notes,
      starters, goals, assists
    } = req.body;

    if (!match_date || !championship || !season || !opponent_id) {
      return res.status(400).json({ error: 'Campos obrigatórios: match_date, championship, season, opponent_id' });
    }

    // Criar jogo
    const matchResult = await query(`
      INSERT INTO matches (match_date, championship, season, opponent_id, flamengo_goals, opponent_goals, is_home, stadium, round, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [match_date, championship, season, opponent_id, flamengo_goals || 0, opponent_goals || 0, is_home !== false, stadium, round, notes]);

    const match = matchResult.rows[0];

    // Inserir titulares
    if (starters && starters.length > 0) {
      for (const starter of starters) {
        await query(`
          INSERT INTO match_players (match_id, player_id, is_starter, position_in_match)
          VALUES ($1, $2, TRUE, $3)
          ON CONFLICT (match_id, player_id) DO NOTHING
        `, [match.id, starter.player_id, starter.position]);
      }
    }

    // Inserir gols
    if (goals && goals.length > 0) {
      for (const goal of goals) {
        await query(`
          INSERT INTO goals (match_id, player_id, minute, is_own_goal, is_penalty)
          VALUES ($1, $2, $3, $4, $5)
        `, [match.id, goal.player_id, goal.minute, goal.is_own_goal || false, goal.is_penalty || false]);
      }
    }

    // Inserir assistências
    if (assists && assists.length > 0) {
      for (const assist of assists) {
        await query(`
          INSERT INTO assists (match_id, player_id, minute)
          VALUES ($1, $2, $3)
        `, [match.id, assist.player_id, assist.minute]);
      }
    }

    res.status(201).json({ message: 'Jogo criado com sucesso', match });
  } catch (error) {
    console.error('Erro ao criar jogo:', error);
    res.status(500).json({ error: 'Erro ao criar jogo' });
  }
};

// PUT /matches/:id - Atualizar jogo
const updateMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      match_date, championship, season, opponent_id,
      flamengo_goals, opponent_goals, is_home,
      stadium, round, notes
    } = req.body;

    const result = await query(`
      UPDATE matches SET
        match_date = COALESCE($1, match_date),
        championship = COALESCE($2, championship),
        season = COALESCE($3, season),
        opponent_id = COALESCE($4, opponent_id),
        flamengo_goals = COALESCE($5, flamengo_goals),
        opponent_goals = COALESCE($6, opponent_goals),
        is_home = COALESCE($7, is_home),
        stadium = COALESCE($8, stadium),
        round = COALESCE($9, round),
        notes = COALESCE($10, notes),
        updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `, [match_date, championship, season, opponent_id, flamengo_goals, opponent_goals, is_home, stadium, round, notes, id]);

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Jogo não encontrado' });
    }

    res.json({ message: 'Jogo atualizado', match: result.rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar jogo:', error);
    res.status(500).json({ error: 'Erro ao atualizar jogo' });
  }
};

// DELETE /matches/:id
const deleteMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM matches WHERE id = $1 RETURNING id', [id]);

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Jogo não encontrado' });
    }

    res.json({ message: 'Jogo deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar jogo:', error);
    res.status(500).json({ error: 'Erro ao deletar jogo' });
  }
};

// GET /matches/seasons - Listar temporadas disponíveis
const getSeasons = async (req, res) => {
  try {
    const result = await query('SELECT DISTINCT season FROM matches ORDER BY season DESC');
    res.json(result.rows.map(r => r.season));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar temporadas' });
  }
};

// GET /matches/championships - Listar campeonatos disponíveis
const getChampionships = async (req, res) => {
  try {
    const result = await query('SELECT DISTINCT championship FROM matches ORDER BY championship');
    res.json(result.rows.map(r => r.championship));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar campeonatos' });
  }
};


// PUT /matches/:id/goals-assists - Atualizar gols e assistências de um jogo
const updateMatchGoalsAssists = async (req, res) => {
  try {
    const { id } = req.params;
    const { goals, assists } = req.body;

    // Verificar se o jogo existe
    const matchCheck = await query('SELECT id FROM matches WHERE id = $1', [id]);
    if (!matchCheck.rows[0]) return res.status(404).json({ error: 'Jogo não encontrado' });

    // Apagar gols e assistências anteriores e reinserir
    await query('DELETE FROM goals WHERE match_id = $1', [id]);
    await query('DELETE FROM assists WHERE match_id = $1', [id]);

    if (goals && goals.length > 0) {
      for (const goal of goals) {
        if (!goal.player_id && !goal.is_own_goal) continue;
        await query(
          'INSERT INTO goals (match_id, player_id, minute, is_own_goal, is_penalty) VALUES ($1, $2, $3, $4, $5)',
          [id, goal.player_id || null, goal.minute || null, goal.is_own_goal || false, goal.is_penalty || false]
        );
      }
    }

    if (assists && assists.length > 0) {
      for (const assist of assists) {
        if (!assist.player_id) continue;
        await query(
          'INSERT INTO assists (match_id, player_id, minute) VALUES ($1, $2, $3)',
          [id, assist.player_id, assist.minute || null]
        );
      }
    }

    res.json({ message: 'Gols e assistências atualizados com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar gols/assistências:', error);
    res.status(500).json({ error: 'Erro ao atualizar gols e assistências' });
  }
};

module.exports = { getMatches, getMatchById, createMatch, updateMatch, deleteMatch, getSeasons, getChampionships, updateMatchGoalsAssists };