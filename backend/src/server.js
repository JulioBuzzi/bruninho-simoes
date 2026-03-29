require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Origens permitidas explicitamente
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean);

// CORS — aceita qualquer subdomínio *.vercel.app (preview + produção)
app.use(cors({
  origin: (origin, callback) => {
    // Sem origin: curl, health checks, Render internos
    if (!origin) return callback(null, true);

    // Qualquer deploy do Vercel (produção e previews com hash)
    if (origin.endsWith('.vercel.app')) return callback(null, true);

    // Origens configuradas via env
    if (allowedOrigins.includes(origin)) return callback(null, true);

    callback(new Error(`CORS bloqueado para origem: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging simples
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas
app.use('/api', routes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 API Bruninho e Simões rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;