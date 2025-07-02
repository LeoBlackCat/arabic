/**
 * Puzzle Game Statistics Manager
 * Tracks user performance and response times for Arabic words
 */

const STORAGE_KEY = 'arabicPuzzleStats';

/**
 * Get all stats from localStorage
 */
export const getStats = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading stats:', error);
    return {};
  }
};

/**
 * Save stats to localStorage
 */
const saveStats = (stats) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving stats:', error);
  }
};

/**
 * Record a successful answer
 * @param {string} verbId - Unique identifier for the verb
 * @param {string} verbChat - Chat representation of the verb
 * @param {string} verbAr - Arabic text
 * @param {string} verbEng - English translation
 * @param {number} timeSeconds - Time taken to answer correctly in seconds
 */
export const recordCorrectAnswer = (verbId, verbChat, verbAr, verbEng, timeSeconds) => {
  const stats = getStats();
  const key = `${verbId}_${verbChat}`;
  
  if (!stats[key]) {
    stats[key] = {
      verbId,
      verbChat,
      verbAr,
      verbEng,
      attempts: 0,
      correctAnswers: 0,
      totalTime: 0,
      averageTime: 0,
      bestTime: null,
      worstTime: null,
      lastAttempt: null,
      firstAttempt: null
    };
  }
  
  const verbStats = stats[key];
  verbStats.attempts += 1;
  verbStats.correctAnswers += 1;
  verbStats.totalTime += timeSeconds;
  verbStats.averageTime = verbStats.totalTime / verbStats.correctAnswers;
  verbStats.lastAttempt = new Date().toISOString();
  
  if (!verbStats.firstAttempt) {
    verbStats.firstAttempt = verbStats.lastAttempt;
  }
  
  if (verbStats.bestTime === null || timeSeconds < verbStats.bestTime) {
    verbStats.bestTime = timeSeconds;
  }
  
  if (verbStats.worstTime === null || timeSeconds > verbStats.worstTime) {
    verbStats.worstTime = timeSeconds;
  }
  
  saveStats(stats);
  console.log(`📊 Recorded: ${verbChat} answered in ${timeSeconds.toFixed(1)}s (avg: ${verbStats.averageTime.toFixed(1)}s)`);
};

/**
 * Record an incorrect answer attempt
 * @param {string} verbId - Unique identifier for the verb
 * @param {string} verbChat - Chat representation of the verb
 * @param {string} verbAr - Arabic text
 * @param {string} verbEng - English translation
 */
export const recordIncorrectAnswer = (verbId, verbChat, verbAr, verbEng) => {
  const stats = getStats();
  const key = `${verbId}_${verbChat}`;
  
  if (!stats[key]) {
    stats[key] = {
      verbId,
      verbChat,
      verbAr,
      verbEng,
      attempts: 0,
      correctAnswers: 0,
      totalTime: 0,
      averageTime: 0,
      bestTime: null,
      worstTime: null,
      lastAttempt: null,
      firstAttempt: null
    };
  }
  
  const verbStats = stats[key];
  verbStats.attempts += 1;
  verbStats.lastAttempt = new Date().toISOString();
  
  if (!verbStats.firstAttempt) {
    verbStats.firstAttempt = verbStats.lastAttempt;
  }
  
  saveStats(stats);
};

/**
 * Get statistics summary
 */
export const getStatsSummary = () => {
  const stats = getStats();
  const verbs = Object.values(stats);
  
  if (verbs.length === 0) {
    return {
      totalVerbs: 0,
      totalAttempts: 0,
      totalCorrect: 0,
      accuracy: 0,
      averageTime: 0,
      verbsWithStats: []
    };
  }
  
  const totalAttempts = verbs.reduce((sum, v) => sum + v.attempts, 0);
  const totalCorrect = verbs.reduce((sum, v) => sum + v.correctAnswers, 0);
  const totalTime = verbs.reduce((sum, v) => sum + v.totalTime, 0);
  
  return {
    totalVerbs: verbs.length,
    totalAttempts,
    totalCorrect,
    accuracy: totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0,
    averageTime: totalCorrect > 0 ? totalTime / totalCorrect : 0,
    verbsWithStats: verbs
  };
};

/**
 * Get verbs sorted by performance (easiest to hardest)
 */
export const getVerbsByPerformance = () => {
  const stats = getStats();
  const verbs = Object.values(stats).filter(v => v.correctAnswers > 0);
  
  // Sort by average time (ascending = easier first)
  return verbs.sort((a, b) => {
    // Primary sort: average time
    if (a.averageTime !== b.averageTime) {
      return a.averageTime - b.averageTime;
    }
    // Secondary sort: accuracy (higher = easier)
    const aAccuracy = a.correctAnswers / a.attempts;
    const bAccuracy = b.correctAnswers / b.attempts;
    return bAccuracy - aAccuracy;
  });
};

/**
 * Get verbs that need more practice (slowest/least accurate)
 */
export const getVerbsNeedingPractice = (limit = 10) => {
  const verbs = getVerbsByPerformance();
  return verbs.slice(-limit).reverse(); // Get worst performers
};

/**
 * Get well-known verbs (fastest/most accurate)
 */
export const getWellKnownVerbs = (limit = 10) => {
  const verbs = getVerbsByPerformance();
  return verbs.slice(0, limit); // Get best performers
};

/**
 * Clear all statistics
 */
export const clearStats = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('📊 All statistics cleared');
  } catch (error) {
    console.error('Error clearing stats:', error);
  }
};

/**
 * Export stats as JSON for backup
 */
export const exportStats = () => {
  const stats = getStats();
  const dataStr = JSON.stringify(stats, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `arabic-puzzle-stats-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};