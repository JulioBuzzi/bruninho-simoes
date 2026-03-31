const jwt = require('jsonwebtoken');

// Verifica token JWT
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expirado' });
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Apenas admin
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito ao administrador' });
  }
  next();
};

// Admin ou rater (qualquer usuário autenticado)
const raterOnly = (req, res, next) => {
  if (!req.user || !['admin', 'rater'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Acesso não autorizado' });
  }
  next();
};

module.exports = { authMiddleware, adminOnly, raterOnly };