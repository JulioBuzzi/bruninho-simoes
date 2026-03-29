const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool do banco de dados:', err);
});

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('Query executada:', { text: text.substring(0, 80), duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Erro na query:', { text: text.substring(0, 80), error: error.message });
    throw error;
  }
};

module.exports = { pool, query };
