-- ============================================================
-- BRUNINHO E SIMÕES - Sistema de Notas de Jogadores
-- Schema PostgreSQL completo
-- ============================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: users (admin)
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABELA: teams (times adversários)
-- ============================================================
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(10),
  logo_url VARCHAR(500),
  state VARCHAR(50),
  country VARCHAR(50) DEFAULT 'Brasil',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABELA: players (jogadores do Flamengo)
-- ============================================================
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  position VARCHAR(30), -- Goleiro, Zagueiro, Lateral, Volante, Meia, Atacante
  number INTEGER,
  photo_url VARCHAR(500),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABELA: matches (jogos)
-- ============================================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_date DATE NOT NULL,
  championship VARCHAR(100) NOT NULL, -- Brasileirão, Libertadores, Copa do Brasil, etc.
  season INTEGER NOT NULL, -- Ano da temporada
  opponent_id UUID NOT NULL REFERENCES teams(id),
  flamengo_goals INTEGER DEFAULT 0,
  opponent_goals INTEGER DEFAULT 0,
  is_home BOOLEAN DEFAULT TRUE, -- TRUE = mandante, FALSE = visitante
  stadium VARCHAR(150),
  round VARCHAR(50), -- Rodada/fase
  notes TEXT, -- Observações gerais do jogo
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABELA: match_players (titulares por jogo)
-- ============================================================
CREATE TABLE match_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),
  is_starter BOOLEAN DEFAULT TRUE,
  position_in_match VARCHAR(30),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

-- ============================================================
-- TABELA: ratings (notas)
-- ============================================================
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),
  bruninho_rating DECIMAL(4,1) CHECK (bruninho_rating >= 0 AND bruninho_rating <= 10),
  simoes_rating DECIMAL(4,1) CHECK (simoes_rating >= 0 AND simoes_rating <= 10),
  average_rating DECIMAL(4,2) GENERATED ALWAYS AS (
    CASE
      WHEN bruninho_rating IS NOT NULL AND simoes_rating IS NOT NULL
        THEN (bruninho_rating + simoes_rating) / 2.0
      WHEN bruninho_rating IS NOT NULL THEN bruninho_rating
      WHEN simoes_rating IS NOT NULL THEN simoes_rating
      ELSE NULL
    END
  ) STORED,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

-- ============================================================
-- TABELA: goals (gols)
-- ============================================================
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id), -- NULL = gol contra
  minute INTEGER,
  is_own_goal BOOLEAN DEFAULT FALSE,
  is_penalty BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABELA: assists (assistências)
-- ============================================================
CREATE TABLE assists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),
  goal_id UUID REFERENCES goals(id),
  minute INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_matches_season ON matches(season);
CREATE INDEX idx_matches_championship ON matches(championship);
CREATE INDEX idx_matches_date ON matches(match_date DESC);
CREATE INDEX idx_ratings_match ON ratings(match_id);
CREATE INDEX idx_ratings_player ON ratings(player_id);
CREATE INDEX idx_match_players_match ON match_players(match_id);
CREATE INDEX idx_match_players_player ON match_players(player_id);
CREATE INDEX idx_goals_match ON goals(match_id);
CREATE INDEX idx_assists_match ON assists(match_id);

-- ============================================================
-- VIEWS
-- ============================================================

-- View: Médias do jogador por campeonato/temporada
CREATE OR REPLACE VIEW player_averages AS
SELECT
  p.id AS player_id,
  p.name AS player_name,
  p.position,
  m.championship,
  m.season,
  COUNT(r.id) AS games_rated,
  ROUND(AVG(r.bruninho_rating), 2) AS avg_bruninho,
  ROUND(AVG(r.simoes_rating), 2) AS avg_simoes,
  ROUND(AVG(r.average_rating), 2) AS avg_overall,
  MAX(r.average_rating) AS best_rating,
  MIN(r.average_rating) AS worst_rating
FROM players p
JOIN ratings r ON r.player_id = p.id
JOIN matches m ON m.id = r.match_id
GROUP BY p.id, p.name, p.position, m.championship, m.season;

-- View: Médias do jogador na temporada (todos campeonatos)
CREATE OR REPLACE VIEW player_season_averages AS
SELECT
  p.id AS player_id,
  p.name AS player_name,
  p.position,
  p.photo_url,
  m.season,
  COUNT(r.id) AS games_rated,
  ROUND(AVG(r.bruninho_rating), 2) AS avg_bruninho,
  ROUND(AVG(r.simoes_rating), 2) AS avg_simoes,
  ROUND(AVG(r.average_rating), 2) AS avg_overall
FROM players p
JOIN ratings r ON r.player_id = p.id
JOIN matches m ON m.id = r.match_id
GROUP BY p.id, p.name, p.position, p.photo_url, m.season;

-- View: MVP e bagre por jogo
CREATE OR REPLACE VIEW match_highlights AS
SELECT
  m.id AS match_id,
  m.match_date,
  m.championship,
  -- MVP (maior média)
  mvp.player_name AS mvp_name,
  mvp.average_rating AS mvp_rating,
  -- Bagre (menor média)
  bagre.player_name AS bagre_name,
  bagre.average_rating AS bagre_rating,
  -- Média do time no jogo
  ROUND(AVG(r.average_rating), 2) AS team_avg
FROM matches m
JOIN ratings r ON r.match_id = m.id
JOIN LATERAL (
  SELECT p.name AS player_name, r2.average_rating
  FROM ratings r2
  JOIN players p ON p.id = r2.player_id
  WHERE r2.match_id = m.id AND r2.average_rating IS NOT NULL
  ORDER BY r2.average_rating DESC
  LIMIT 1
) mvp ON TRUE
JOIN LATERAL (
  SELECT p.name AS player_name, r3.average_rating
  FROM ratings r3
  JOIN players p ON p.id = r3.player_id
  WHERE r3.match_id = m.id AND r3.average_rating IS NOT NULL
  ORDER BY r3.average_rating ASC
  LIMIT 1
) bagre ON TRUE
GROUP BY m.id, m.match_date, m.championship, mvp.player_name, mvp.average_rating, bagre.player_name, bagre.average_rating;

-- ============================================================
-- DADOS INICIAIS - Times do Brasileirão e outras competições
-- ============================================================
INSERT INTO teams (name, short_name, logo_url, state) VALUES
('Fluminense', 'FLU', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Fluminense_FC_crest.svg/200px-Fluminense_FC_crest.svg.png', 'Rio de Janeiro'),
('Vasco da Gama', 'VAS', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/CR_Vasco_da_Gama_logo.svg/200px-CR_Vasco_da_Gama_logo.svg.png', 'Rio de Janeiro'),
('Botafogo', 'BOT', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Botafogo_de_Futebol_e_Regatas_logo.svg/200px-Botafogo_de_Futebol_e_Regatas_logo.svg.png', 'Rio de Janeiro'),
('São Paulo', 'SAO', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Sao_Paulo_FC.svg/200px-Sao_Paulo_FC.svg.png', 'São Paulo'),
('Corinthians', 'COR', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Sport_Club_Corinthians_Paulista_crest.svg/200px-Sport_Club_Corinthians_Paulista_crest.svg.png', 'São Paulo'),
('Palmeiras', 'PAL', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Palmeiras_logo.svg/200px-Palmeiras_logo.svg.png', 'São Paulo'),
('Santos', 'SAN', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Santos_FC_Logo.svg/200px-Santos_FC_Logo.svg.png', 'São Paulo'),
('Atlético-MG', 'CAM', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Atletico_mineiro_galo.svg/200px-Atletico_mineiro_galo.svg.png', 'Minas Gerais'),
('Cruzeiro', 'CRU', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Cruzeiro_Esporte_Clube_crest.svg/200px-Cruzeiro_Esporte_Clube_crest.svg.png', 'Minas Gerais'),
('Grêmio', 'GRE', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Gremio_Foot-Ball_Porto_Alegrense_logo.svg/200px-Gremio_Foot-Ball_Porto_Alegrense_logo.svg.png', 'Rio Grande do Sul'),
('Internacional', 'INT', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Sport_Club_Internacional.svg/200px-Sport_Club_Internacional.svg.png', 'Rio Grande do Sul'),
('Bahia', 'BAH', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Esporte_Clube_Bahia_logo.svg/200px-Esporte_Clube_Bahia_logo.svg.png', 'Bahia'),
('Fortaleza', 'FOR', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Fortaleza_EC_logo.svg/200px-Fortaleza_EC_logo.svg.png', 'Ceará'),
('Ceará', 'CEA', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Ceara_Sporting_Club_crest.svg/200px-Ceara_Sporting_Club_crest.svg.png', 'Ceará'),
('Sport Recife', 'SPT', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Sport_Club_do_Recife.svg/200px-Sport_Club_do_Recife.svg.png', 'Pernambuco'),
('Athletico-PR', 'CAP', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Clube_Atletico_Paranaense.svg/200px-Clube_Atletico_Paranaense.svg.png', 'Paraná'),
('Coritiba', 'CFC', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Coritiba_FBC.svg/200px-Coritiba_FBC.svg.png', 'Paraná'),
('Goiás', 'GOI', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Goi%C3%A1s_Esporte_Clube.svg/200px-Goi%C3%A1s_Esporte_Clube.svg.png', 'Goiás'),
('Cuiabá', 'CUI', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Cuiab%C3%A1_Esporte_Clube.svg/200px-Cuiab%C3%A1_Esporte_Clube.svg.png', 'Mato Grosso'),
('Bragantino', 'RBB', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Red_Bull_Bragantino_crest.svg/200px-Red_Bull_Bragantino_crest.svg.png', 'São Paulo'),
-- Times internacionais Libertadores
('River Plate', 'RIV', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/River_Plate_logo.svg/200px-River_Plate_logo.svg.png', NULL),
('Boca Juniors', 'BOC', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Boca_Juniors_logo.svg/200px-Boca_Juniors_logo.svg.png', NULL),
('Nacional', 'NAC', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Club_Nacional_de_Football.svg/200px-Club_Nacional_de_Football.svg.png', NULL),
('Peñarol', 'PEN', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/CA_Pe%C3%B1arol.svg/200px-CA_Pe%C3%B1arol.svg.png', NULL);

-- ============================================================
-- DADOS INICIAIS - Jogadores do Flamengo
-- ============================================================
INSERT INTO players (name, position, number) VALUES
('Rossi', 'Goleiro', 1),
('Wesley', 'Lateral Direito', 2),
('Fabrício Bruno', 'Zagueiro', 3),
('Léo Ortiz', 'Zagueiro', 4),
('Ayrton Lucas', 'Lateral Esquerdo', 6),
('Erick Pulgar', 'Volante', 5),
('Gerson', 'Volante', 8),
('De la Cruz', 'Meia', 18),
('Arrascaeta', 'Meia', 14),
('Michael', 'Atacante', 11),
('Gabigol', 'Atacante', 99),
('Pedro', 'Atacante', 9),
('Plata', 'Atacante', 21),
('Viña', 'Lateral Esquerdo', 3),
('David Luiz', 'Zagueiro', 23),
('Allan', 'Volante', 17),
('Éverton Ribeiro', 'Meia', 7),
('Bruno Henrique', 'Atacante', 27),
('Matheus Gonçalves', 'Meia', 44),
('Lorran', 'Meia', 66);

-- ============================================================
-- USUÁRIO ADMIN PADRÃO
-- Senha: admin123 (bcrypt hash)
-- ============================================================
INSERT INTO users (username, password_hash) VALUES
('admin', '$2b$10$rQnkMkXxGqPgVrEgEi3mSuQiH8Pz0uFvEbFtqJpqWxRt2O5MjCwLy');
-- IMPORTANTE: Altere esta senha em produção!
