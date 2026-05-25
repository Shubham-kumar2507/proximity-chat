/**
 * Two Truths & a Lie Game API service.
 * All game-related API calls go through the centralized api.js module.
 *
 * @module services/truthsGameApi
 */
import api from './api';

/**
 * Fetch the game state for a target user.
 * @param {string} userId - Target user ID
 * @returns {Promise<Object>} Game data with statements, lock state, etc.
 */
export async function fetchTruthsGame(userId) {
  const res = await api.get(`/users/${userId}/truths-game`);
  return res.data.data;
}

/**
 * Submit a guess for a target user's lie.
 * @param {string} userId - Target user ID
 * @param {number} guessedIndex - 0, 1, or 2
 * @returns {Promise<Object>} Result with { correct: boolean }
 */
export async function submitGuess(userId, guessedIndex) {
  const res = await api.post(`/users/${userId}/truths-game/guess`, {
    guessed_index: guessedIndex,
  });
  return res.data.data;
}

export default { fetchTruthsGame, submitGuess };
