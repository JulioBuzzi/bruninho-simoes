const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly, raterOnly } = require('../middleware/auth');

const { login, me } = require('../controllers/authController');
const { getMatches, getMatchById, createMatch, updateMatch, deleteMatch, getSeasons, getChampionships, updateMatchGoalsAssists } = require('../controllers/matchesController');
const { saveRatings, getPlayerRatings, getStats } = require('../controllers/ratingsController');
const { getPlayers, getPlayerById, createPlayer, updatePlayer } = require('../controllers/playersController');
const { getTeams, createTeam, updateTeam } = require('../controllers/teamsController');

// ── AUTH ──
router.post('/auth/login', login);
router.get('/auth/me', authMiddleware, me);

// ── MATCHES (leitura pública) ──
router.get('/matches', getMatches);
router.get('/matches/seasons', getSeasons);
router.get('/matches/championships', getChampionships);
router.get('/matches/:id', getMatchById);

// ── MATCHES (escrita: só admin) ──
router.post('/matches', authMiddleware, adminOnly, createMatch);
// Rota específica ANTES da genérica /:id para evitar conflito de captura
router.put('/matches/:id/goals-assists', authMiddleware, adminOnly, updateMatchGoalsAssists);
router.put('/matches/:id', authMiddleware, adminOnly, updateMatch);
router.delete('/matches/:id', authMiddleware, adminOnly, deleteMatch);

// ── RATINGS (notas: qualquer autenticado) ──
router.post('/ratings', authMiddleware, saveRatings);
router.get('/ratings/stats', getStats);
router.get('/ratings/player/:playerId', getPlayerRatings);

// ── PLAYERS ──
router.get('/players', getPlayers);
router.get('/players/:id', getPlayerById);
router.post('/players', authMiddleware, adminOnly, createPlayer);
router.put('/players/:id', authMiddleware, adminOnly, updatePlayer);

// ── TEAMS ──
router.get('/teams', getTeams);
router.post('/teams', authMiddleware, adminOnly, createTeam);
router.put('/teams/:id', authMiddleware, adminOnly, updateTeam);

module.exports = router;