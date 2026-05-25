/**
 * useTwoTruthsGame — Custom hook for Two Truths & a Lie game state.
 * Manages game lifecycle: loading, selecting, confirming, and results.
 *
 * @module hooks/useTwoTruthsGame
 */
import { useState, useCallback, useEffect } from 'react';
import { fetchTruthsGame, submitGuess } from '../services/truthsGameApi';

/** Game states */
export const GAME_STATE = {
  LOADING: 'loading',
  IDLE: 'idle',
  SELECTED: 'selected',
  CORRECT: 'correct',
  WRONG: 'wrong',
  LOCKED: 'locked',
  ERROR: 'error',
};

/**
 * @param {string} targetUserId - The user whose game to play
 * @returns {Object} Game state and actions
 */
export default function useTwoTruthsGame(targetUserId) {
  const [gameState, setGameState] = useState(GAME_STATE.LOADING);
  const [statements, setStatements] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [targetName, setTargetName] = useState('');
  const [targetPhotoUrl, setTargetPhotoUrl] = useState(null);
  const [lockExpiresAt, setLockExpiresAt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Load game data from API
   */
  const loadGame = useCallback(async () => {
    if (!targetUserId) return;
    setGameState(GAME_STATE.LOADING);
    try {
      const data = await fetchTruthsGame(targetUserId);
      setStatements(data.statements || []);
      setTargetName(data.targetName || '');
      setTargetPhotoUrl(data.targetPhotoUrl || null);

      if (data.gameLocked) {
        const expiresAt = data.lastGuessAt
          ? new Date(new Date(data.lastGuessAt).getTime() + 86400000)
          : null;
        setLockExpiresAt(expiresAt);
        setGameState(GAME_STATE.LOCKED);
      } else {
        setGameState(GAME_STATE.IDLE);
      }
    } catch (err) {
      console.error('Failed to load truths game:', err.message);
      setGameState(GAME_STATE.ERROR);
    }
  }, [targetUserId]);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  /**
   * Select an option (before confirming)
   * @param {number} index
   */
  const selectOption = useCallback((index) => {
    if (gameState !== GAME_STATE.IDLE && gameState !== GAME_STATE.SELECTED) return;
    setSelectedIndex(index);
    setGameState(GAME_STATE.SELECTED);
  }, [gameState]);

  /**
   * Reset selection back to idle
   */
  const resetSelection = useCallback(() => {
    setSelectedIndex(null);
    setGameState(GAME_STATE.IDLE);
  }, []);

  /**
   * Confirm the guess
   */
  const confirmGuess = useCallback(async () => {
    if (selectedIndex === null || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await submitGuess(targetUserId, selectedIndex);
      if (result.correct) {
        setGameState(GAME_STATE.CORRECT);
      } else {
        setGameState(GAME_STATE.WRONG);
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setGameState(GAME_STATE.LOCKED);
      } else {
        console.error('Guess submission failed:', err.message);
        setGameState(GAME_STATE.ERROR);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedIndex, targetUserId, isSubmitting]);

  return {
    gameState,
    statements,
    selectedIndex,
    targetName,
    targetPhotoUrl,
    lockExpiresAt,
    isSubmitting,
    selectOption,
    resetSelection,
    confirmGuess,
    loadGame,
  };
}
