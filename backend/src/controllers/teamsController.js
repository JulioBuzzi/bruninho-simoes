const { query } = require('../config/database');

const getTeams = async (req, res) => {
  try {
    const result = await query('SELECT * FROM teams ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar times' });
  }
};

const createTeam = async (req, res) => {
  try {
    const { name, short_name, logo_url, state, country } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

    const result = await query(`
      INSERT INTO teams (name, short_name, logo_url, state, country)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [name, short_name, logo_url, state, country || 'Brasil']);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar time' });
  }
};

const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, short_name, logo_url, state, country } = req.body;

    const result = await query(`
      UPDATE teams SET
        name = COALESCE($1, name),
        short_name = COALESCE($2, short_name),
        logo_url = COALESCE($3, logo_url),
        state = COALESCE($4, state),
        country = COALESCE($5, country)
      WHERE id = $6 RETURNING *
    `, [name, short_name, logo_url, state, country, id]);

    if (!result.rows[0]) return res.status(404).json({ error: 'Time não encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar time' });
  }
};

module.exports = { getTeams, createTeam, updateTeam };
