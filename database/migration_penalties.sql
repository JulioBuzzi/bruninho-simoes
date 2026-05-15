-- Migration: adiciona suporte a mata-mata e disputa de pênaltis
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS is_knockout BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS had_penalties BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS flamengo_penalties INTEGER,
  ADD COLUMN IF NOT EXISTS opponent_penalties INTEGER;
