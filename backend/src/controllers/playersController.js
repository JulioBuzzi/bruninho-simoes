const { query } = require('../config/database');

const getPlayers = async (req, res) => {
  try {
    const { active } = req.query;
    const conditions = active !== undefined ? ['active = $1'] : [];
    const params = active !== undefined ? [active === 'true'] : [];

    const result = await query(`
      SELECT * FROM players
      ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
      ORDER BY
        CASE position
          WHEN 'Goleiro' THEN 1
          WHEN 'Zagueiro' THEN 2
          WHEN 'Lateral Direito' THEN 3
          WHEN 'Lateral Esquerdo' THEN 4
          WHEN 'Volante' THEN 5
          WHEN 'Meia' THEN 6
          WHEN 'Atacante' THEN 7
          ELSE 8
        END, name
    `, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar jogadores' });
  }
};

const getPlayerById = async (req, res) => {
  try {
    const { id } = req.params;
    const { season } = req.query;
    const currentSeason = season || new Date().getFullYear();

    const playerResult = await query('SELECT * FROM players WHERE id = $1', [id]);
    if (!playerResult.rows[0]) return res.status(404).json({ error: 'Jogador não encontrado' });

    const player = playerResult.rows[0];

    // Estatísticas da temporada
    const statsResult = await query(`
      SELECT
        COUNT(r.id) AS games,
        ROUND(AVG(r.average_rating), 2) AS avg_overall,
        ROUND(AVG(r.bruninho_rating), 2) AS avg_bruninho,
        ROUND(AVG(r.simoes_rating), 2) AS avg_simoes,
        MAX(r.average_rating) AS best_rating,
        MIN(r.average_rating) AS worst_rating
      FROM ratings r
      JOIN matches m ON m.id = r.match_id
      WHERE r.player_id = $1 AND m.season = $2
    `, [id, currentSeason]);

    // Histórico de jogos
    const historyResult = await query(`
      SELECT
        m.id AS match_id,
        m.match_date,
        m.championship,
        m.flamengo_goals,
        m.opponent_goals,
        t.name AS opponent_name,
        t.logo_url AS opponent_logo,
        r.bruninho_rating,
        r.simoes_rating,
        r.average_rating
      FROM ratings r
      JOIN matches m ON m.id = r.match_id
      JOIN teams t ON t.id = m.opponent_id
      WHERE r.player_id = $1 AND m.season = $2
      ORDER BY m.match_date DESC
    `, [id, currentSeason]);

    // Gols na temporada
    const goalsResult = await query(`
      SELECT COUNT(*) AS goals FROM goals g
      JOIN matches m ON m.id = g.match_id
      WHERE g.player_id = $1 AND m.season = $2 AND g.is_own_goal = FALSE
    `, [id, currentSeason]);

    const assistsResult = await query(`
      SELECT COUNT(*) AS assists FROM assists a
      JOIN matches m ON m.id = a.match_id
      WHERE a.player_id = $1 AND m.season = $2
    `, [id, currentSeason]);

    res.json({
      player,
      season: currentSeason,
      stats: {
        ...statsResult.rows[0],
        goals: parseInt(goalsResult.rows[0].goals),
        assists: parseInt(assistsResult.rows[0].assists)
      },
      history: historyResult.rows
    });
  } catch (error) {
    console.error('Erro ao buscar jogador:', error);
    res.status(500).json({ error: 'Erro ao buscar jogador' });
  }
};

const createPlayer = async (req, res) => {
  try {
    const { name, position, number, photo_url } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

    const result = await query(`
      INSERT INTO players (name, position, number, photo_url)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [name, position, number, photo_url]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar jogador' });
  }
};

const updatePlayer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, position, number, photo_url, active } = req.body;

    const result = await query(`
      UPDATE players SET
        name = COALESCE($1, name),
        position = COALESCE($2, position),
        number = COALESCE($3, number),
        photo_url = COALESCE($4, photo_url),
        active = COALESCE($5, active)
      WHERE id = $6 RETURNING *
    `, [name, position, number, photo_url, active, id]);

    if (!result.rows[0]) return res.status(404).json({ error: 'Jogador não encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar jogador' });
  }
};

module.exports = { getPlayers, getPlayerById, createPlayer, updatePlayer };
