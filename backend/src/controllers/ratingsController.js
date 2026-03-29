const { query } = require('../config/database');

// POST /ratings - Salvar/atualizar notas de um jogo inteiro
const saveRatings = async (req, res) => {
  try {
    const { match_id, ratings } = req.body;

    if (!match_id || !ratings || !Array.isArray(ratings)) {
      return res.status(400).json({ error: 'match_id e ratings[] são obrigatórios' });
    }

    const saved = [];
    for (const rating of ratings) {
      const { player_id, bruninho_rating, simoes_rating } = rating;

      if (!player_id) continue;

      const result = await query(`
        INSERT INTO ratings (match_id, player_id, bruninho_rating, simoes_rating)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (match_id, player_id)
        DO UPDATE SET
          bruninho_rating = EXCLUDED.bruninho_rating,
          simoes_rating = EXCLUDED.simoes_rating,
          updated_at = NOW()
        RETURNING *
      `, [match_id, player_id, bruninho_rating ?? null, simoes_rating ?? null]);

      saved.push(result.rows[0]);
    }

    res.json({ message: 'Notas salvas com sucesso', ratings: saved });
  } catch (error) {
    console.error('Erro ao salvar notas:', error);
    res.status(500).json({ error: 'Erro ao salvar notas' });
  }
};

// GET /ratings/player/:playerId - Histórico de notas de um jogador
const getPlayerRatings = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { season, championship } = req.query;

    const params = [playerId];
    const conditions = ['r.player_id = $1'];

    if (season) {
      params.push(parseInt(season));
      conditions.push(`m.season = $${params.length}`);
    }
    if (championship) {
      params.push(championship);
      conditions.push(`m.championship = $${params.length}`);
    }

    const result = await query(`
      SELECT
        r.*,
        m.match_date,
        m.championship,
        m.season,
        m.flamengo_goals,
        m.opponent_goals,
        m.is_home,
        t.name AS opponent_name,
        t.logo_url AS opponent_logo
      FROM ratings r
      JOIN matches m ON m.id = r.match_id
      JOIN teams t ON t.id = m.opponent_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY m.match_date DESC
    `, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar notas do jogador:', error);
    res.status(500).json({ error: 'Erro ao buscar notas' });
  }
};

// GET /ratings/stats - Estatísticas gerais
const getStats = async (req, res) => {
  try {
    const { season } = req.query;
    const currentSeason = season || new Date().getFullYear();

    // Ranking de jogadores na temporada
    const rankingResult = await query(`
      SELECT
        p.id,
        p.name,
        p.position,
        p.photo_url,
        COUNT(r.id) AS games,
        ROUND(AVG(r.average_rating), 2) AS avg_overall,
        ROUND(AVG(r.bruninho_rating), 2) AS avg_bruninho,
        ROUND(AVG(r.simoes_rating), 2) AS avg_simoes,
        MAX(r.average_rating) AS best_game,
        MIN(r.average_rating) AS worst_game,
        COUNT(CASE WHEN r.average_rating >= 7 THEN 1 END) AS craque_count,
        COUNT(CASE WHEN r.average_rating <= 4 THEN 1 END) AS bagre_count
      FROM players p
      JOIN ratings r ON r.player_id = p.id
      JOIN matches m ON m.id = r.match_id
      WHERE m.season = $1
      GROUP BY p.id, p.name, p.position, p.photo_url
      HAVING COUNT(r.id) >= 3
      ORDER BY avg_overall DESC NULLS LAST
    `, [currentSeason]);

    // Ranking por campeonato
    const byChampionshipResult = await query(`
      SELECT
        p.id,
        p.name,
        m.championship,
        COUNT(r.id) AS games,
        ROUND(AVG(r.average_rating), 2) AS avg_overall
      FROM players p
      JOIN ratings r ON r.player_id = p.id
      JOIN matches m ON m.id = r.match_id
      WHERE m.season = $1
      GROUP BY p.id, p.name, m.championship
      ORDER BY m.championship, avg_overall DESC NULLS LAST
    `, [currentSeason]);

    // Comparação Bruninho vs Simões
    const comparisonResult = await query(`
      SELECT
        ROUND(AVG(bruninho_rating), 2) AS avg_bruninho,
        ROUND(AVG(simoes_rating), 2) AS avg_simoes,
        COUNT(CASE WHEN bruninho_rating > simoes_rating THEN 1 END) AS bruninho_higher,
        COUNT(CASE WHEN simoes_rating > bruninho_rating THEN 1 END) AS simoes_higher,
        COUNT(CASE WHEN bruninho_rating = simoes_rating THEN 1 END) AS equal
      FROM ratings r
      JOIN matches m ON m.id = r.match_id
      WHERE m.season = $1 AND bruninho_rating IS NOT NULL AND simoes_rating IS NOT NULL
    `, [currentSeason]);

    // Evolução mensal do time
    const evolutionResult = await query(`
      SELECT
        TO_CHAR(m.match_date, 'YYYY-MM') AS month,
        ROUND(AVG(r.average_rating), 2) AS avg_rating,
        COUNT(DISTINCT m.id) AS games_count
      FROM ratings r
      JOIN matches m ON m.id = r.match_id
      WHERE m.season = $1
      GROUP BY TO_CHAR(m.match_date, 'YYYY-MM')
      ORDER BY month
    `, [currentSeason]);

    res.json({
      season: currentSeason,
      ranking: rankingResult.rows,
      by_championship: byChampionshipResult.rows,
      bruninho_vs_simoes: comparisonResult.rows[0],
      monthly_evolution: evolutionResult.rows
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

module.exports = { saveRatings, getPlayerRatings, getStats };