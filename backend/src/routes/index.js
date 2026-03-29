const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Controllers
const { login, me } = require('../controllers/authController');
const { getMatches, getMatchById, createMatch, updateMatch, deleteMatch, getSeasons, getChampionships } = require('../controllers/matchesController');
const { saveRatings, getPlayerRatings, getStats } = require('../controllers/ratingsController');
const { getPlayers, getPlayerById, createPlayer, updatePlayer } = require('../controllers/playersController');
const { getTeams, createTeam, updateTeam } = require('../controllers/teamsController');

// ---- AUTH ----
router.post('/auth/login', login);
router.get('/auth/me', auth, me);

// ---- MATCHES (público para leitura) ----
router.get('/matches', getMatches);
router.get('/matches/seasons', getSeasons);
router.get('/matches/championships', getChampionships);
router.get('/matches/:id', getMatchById);
router.post('/matches', auth, createMatch);
router.put('/matches/:id', auth, updateMatch);
router.delete('/matches/:id', auth, deleteMatch);

// ---- RATINGS ----
router.post('/ratings', auth, saveRatings);
router.get('/ratings/stats', getStats);
router.get('/ratings/player/:playerId', getPlayerRatings);

// ---- PLAYERS ----
router.get('/players', getPlayers);
router.get('/players/:id', getPlayerById);
router.post('/players', auth, createPlayer);
router.put('/players/:id', auth, updatePlayer);

// ---- TEAMS ----
router.get('/teams', getTeams);
router.post('/teams', auth, createTeam);
router.put('/teams/:id', auth, updateTeam);

module.exports = router;
