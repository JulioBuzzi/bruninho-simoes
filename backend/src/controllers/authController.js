const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username e senha são obrigatórios' });
    }
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const me = async (req, res) => {
  res.json({ user: req.user });
};

// Renova o token sem precisar fazer login novamente
// Só renova se o token atual ainda for válido (não expirado)
const refresh = async (req, res) => {
  try {
    const { id, username, role } = req.user; // vem do authMiddleware

    // Verificar se o usuário ainda existe no banco
    const result = await query('SELECT id, username, role FROM users WHERE id = $1', [id]);
    if (!result.rows[0]) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const newToken = jwt.sign(
      { id, username, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token: newToken,
      user: { id, username, role }
    });
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json({ error: 'Erro ao renovar sessão' });
  }
};

module.exports = { login, me, refresh };