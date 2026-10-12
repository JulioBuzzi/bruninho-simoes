const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const { query } = require('../config/database');

let sessionTableReady;

const ensureSessionTable = () => {
  if (!sessionTableReady) {
    sessionTableReady = query(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `).catch((error) => {
      sessionTableReady = null;
      throw error;
    });
  }
  return sessionTableReady;
};

const issueSession = async (user, existingSessionId = null) => {
  await ensureSessionTable();
  const sessionId = existingSessionId || randomUUID();
  if (!existingSessionId) {
    await query('INSERT INTO auth_sessions (id, user_id) VALUES ($1, $2)', [sessionId, user.id]);
  }

  return {
    token: jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    ),
    refreshToken: jwt.sign(
      { id: user.id, sessionId, type: 'refresh' },
      process.env.JWT_SECRET
    ),
    user: { id: user.id, username: user.username, role: user.role }
  };
};

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

    res.json(await issueSession(user));
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
    let userId;
    let sessionId = null;
    const { refreshToken } = req.body || {};

    if (refreshToken) {
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      } catch {
        return res.status(401).json({ error: 'Sessão inválida; faça login novamente' });
      }
      if (decoded.type !== 'refresh' || !decoded.sessionId) {
        return res.status(401).json({ error: 'Sessão inválida; faça login novamente' });
      }

      await ensureSessionTable();
      const session = await query(
        'SELECT user_id FROM auth_sessions WHERE id = $1 AND user_id = $2',
        [decoded.sessionId, decoded.id]
      );
      if (!session.rows[0]) {
        return res.status(401).json({ error: 'Sessão encerrada; faça login novamente' });
      }
      userId = decoded.id;
      sessionId = decoded.sessionId;
    } else {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Sessão inválida; faça login novamente' });
      }
      try {
        userId = jwt.verify(authHeader.substring(7), process.env.JWT_SECRET).id;
      } catch {
        return res.status(401).json({ error: 'Sessão expirada; faça login novamente' });
      }
    }

    const result = await query('SELECT id, username, role FROM users WHERE id = $1', [userId]);
    if (!result.rows[0]) return res.status(401).json({ error: 'Usuário não encontrado' });

    res.json(await issueSession(result.rows[0], sessionId));
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json({ error: 'Erro ao renovar sessão' });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (refreshToken) {
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      } catch {
        return res.json({ message: 'Sessão encerrada' });
      }
      if (decoded.type === 'refresh' && decoded.sessionId) {
        await ensureSessionTable();
        await query('DELETE FROM auth_sessions WHERE id = $1 AND user_id = $2', [
          decoded.sessionId,
          decoded.id
        ]);
      }
    }
    res.json({ message: 'Sessão encerrada' });
  } catch (error) {
    console.error('Erro ao encerrar sessão:', error);
    res.status(500).json({ error: 'Erro ao encerrar sessão' });
  }
};

module.exports = { login, me, refresh, logout };