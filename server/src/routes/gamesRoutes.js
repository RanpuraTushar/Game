// server/src/routes/gamesRoutes.js
import express from 'express';
import { getAllGames, getRandomGame, getGameById, submitGameScore, getUserHighScores } from '../controllers/gameController.js';

const router = express.Router();

router.get('/', getAllGames);
router.get('/random', getRandomGame);
router.get('/highscores/:userId', getUserHighScores);
router.get('/:gameId', getGameById);
router.post('/score', submitGameScore);

export default router;
