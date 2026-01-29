/**
 * Enhanced Statistics Tracking System (localStorage v2)
 *
 * Tracks comprehensive training statistics including:
 * - Lifetime totals
 * - Performance by difficulty (Easy/Medium/Hard)
 * - Performance by category (HARD/SOFT/PAIR)
 * - Performance by decision type (Hit/Stand/Double/Split)
 * - Recent mistakes history
 * - Progress history (rolling 30-day window)
 */

const STATS_KEY = 'blackjack_trainer_stats_v2';
const MAX_RECENT_MISTAKES = 20;
const PROGRESS_HISTORY_DAYS = 30;

/**
 * Initialize default stats structure
 */
function getDefaultStats() {
  return {
    version: 2,
    lifetime: {
      totalSessions: 0,
      totalDecisions: 0,
      correctDecisions: 0,
      overallAccuracy: 0,
      bestStreak: 0,
      totalTimeMs: 0,
      lastPlayed: null
    },
    byDifficulty: {
      Easy: { correct: 0, total: 0, accuracy: 0 },
      Medium: { correct: 0, total: 0, accuracy: 0 },
      Hard: { correct: 0, total: 0, accuracy: 0 }
    },
    byCategory: {
      HARD: { correct: 0, total: 0, accuracy: 0 },
      SOFT: { correct: 0, total: 0, accuracy: 0 },
      PAIR: { correct: 0, total: 0, accuracy: 0 }
    },
    byDecisionType: {
      Hit: { correct: 0, total: 0, accuracy: 0 },
      Stand: { correct: 0, total: 0, accuracy: 0 },
      Double: { correct: 0, total: 0, accuracy: 0 },
      Split: { correct: 0, total: 0, accuracy: 0 }
    },
    recentMistakes: [],
    progressHistory: []
  };
}

/**
 * Load stats from localStorage
 */
export function loadStats() {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (!stored) {
      return getDefaultStats();
    }

    const stats = JSON.parse(stored);

    // Migrate from v1 if needed
    if (!stats.version || stats.version < 2) {
      return migrateFromV1(stats);
    }

    return stats;
  } catch (error) {
    console.error('Error loading stats:', error);
    return getDefaultStats();
  }
}

/**
 * Save stats to localStorage
 */
export function saveStats(stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving stats:', error);
  }
}

/**
 * Migrate from v1 stats to v2
 */
function migrateFromV1(oldStats) {
  const newStats = getDefaultStats();

  // Try to extract what we can from v1
  if (oldStats.bestStreak !== undefined) {
    newStats.lifetime.bestStreak = oldStats.bestStreak;
  }
  if (oldStats.totalCorrect !== undefined && oldStats.totalAttempts !== undefined) {
    newStats.lifetime.totalDecisions = oldStats.totalAttempts;
    newStats.lifetime.correctDecisions = oldStats.totalCorrect;
    newStats.lifetime.overallAccuracy = oldStats.totalAttempts > 0
      ? oldStats.totalCorrect / oldStats.totalAttempts
      : 0;
  }

  newStats.lifetime.lastPlayed = new Date().toISOString();

  console.log('Migrated stats from v1 to v2');
  return newStats;
}

/**
 * Record a training decision
 */
export function recordDecision(stats, decision) {
  const {
    isCorrect,
    difficulty,
    category,
    chosenAction,
    correctAction,
    playerTotal,
    dealerUp,
    timeTakenMs = 0
  } = decision;

  // Update lifetime
  stats.lifetime.totalDecisions++;
  if (isCorrect) {
    stats.lifetime.correctDecisions++;
  }
  stats.lifetime.overallAccuracy =
    stats.lifetime.correctDecisions / stats.lifetime.totalDecisions;
  stats.lifetime.lastPlayed = new Date().toISOString();

  // Update by difficulty
  if (difficulty && stats.byDifficulty[difficulty]) {
    stats.byDifficulty[difficulty].total++;
    if (isCorrect) {
      stats.byDifficulty[difficulty].correct++;
    }
    stats.byDifficulty[difficulty].accuracy =
      stats.byDifficulty[difficulty].correct / stats.byDifficulty[difficulty].total;
  }

  // Update by category
  if (category && stats.byCategory[category]) {
    stats.byCategory[category].total++;
    if (isCorrect) {
      stats.byCategory[category].correct++;
    }
    stats.byCategory[category].accuracy =
      stats.byCategory[category].correct / stats.byCategory[category].total;
  }

  // Update by decision type
  if (chosenAction && stats.byDecisionType[chosenAction]) {
    stats.byDecisionType[chosenAction].total++;
    if (isCorrect) {
      stats.byDecisionType[chosenAction].correct++;
    }
    stats.byDecisionType[chosenAction].accuracy =
      stats.byDecisionType[chosenAction].correct / stats.byDecisionType[chosenAction].total;
  }

  // Record mistake
  if (!isCorrect) {
    const mistake = {
      timestamp: new Date().toISOString(),
      category,
      playerTotal,
      dealerUp,
      chosenAction,
      correctAction,
      difficulty,
      timeTakenMs
    };

    stats.recentMistakes.unshift(mistake);

    // Keep only last N mistakes
    if (stats.recentMistakes.length > MAX_RECENT_MISTAKES) {
      stats.recentMistakes = stats.recentMistakes.slice(0, MAX_RECENT_MISTAKES);
    }
  }

  // Update progress history (daily aggregation)
  updateProgressHistory(stats);

  saveStats(stats);
  return stats;
}

/**
 * Update progress history with daily aggregation
 */
function updateProgressHistory(stats) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const history = stats.progressHistory;

  // Find today's entry
  let todayEntry = history.find(entry => entry.date === today);

  if (!todayEntry) {
    // Create new entry for today
    todayEntry = {
      date: today,
      decisions: 0,
      correct: 0,
      accuracy: 0
    };
    history.push(todayEntry);
  }

  // Update today's stats (recalculate from lifetime - this is approximate)
  // In a real implementation, we'd track session-level stats
  todayEntry.decisions = stats.lifetime.totalDecisions;
  todayEntry.correct = stats.lifetime.correctDecisions;
  todayEntry.accuracy = stats.lifetime.overallAccuracy;

  // Keep only last N days
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - PROGRESS_HISTORY_DAYS);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  stats.progressHistory = history
    .filter(entry => entry.date >= cutoffStr)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Start a new training session
 */
export function startSession(stats) {
  stats.lifetime.totalSessions++;
  stats.sessionStartTime = Date.now();
  saveStats(stats);
  return stats;
}

/**
 * End the current training session
 */
export function endSession(stats) {
  if (stats.sessionStartTime) {
    const duration = Date.now() - stats.sessionStartTime;
    stats.lifetime.totalTimeMs += duration;
    delete stats.sessionStartTime;
    saveStats(stats);
  }
  return stats;
}

/**
 * Update best streak
 */
export function updateBestStreak(stats, currentStreak) {
  if (currentStreak > stats.lifetime.bestStreak) {
    stats.lifetime.bestStreak = currentStreak;
    saveStats(stats);
  }
  return stats;
}

/**
 * Reset all stats
 */
export function resetStats() {
  const stats = getDefaultStats();
  saveStats(stats);
  return stats;
}

/**
 * Get formatted stats summary
 */
export function getStatsSummary(stats) {
  const { lifetime, byDifficulty, byCategory } = stats;

  return {
    overall: {
      decisions: lifetime.totalDecisions,
      accuracy: Math.round(lifetime.overallAccuracy * 100),
      bestStreak: lifetime.bestStreak,
      sessions: lifetime.totalSessions,
      totalHours: Math.round(lifetime.totalTimeMs / 3600000 * 10) / 10,
      lastPlayed: lifetime.lastPlayed ? new Date(lifetime.lastPlayed).toLocaleDateString() : 'Never'
    },
    difficulty: Object.entries(byDifficulty).map(([name, data]) => ({
      name,
      accuracy: Math.round(data.accuracy * 100),
      total: data.total
    })),
    category: Object.entries(byCategory).map(([name, data]) => ({
      name,
      accuracy: Math.round(data.accuracy * 100),
      total: data.total
    }))
  };
}

/**
 * Export stats for backup/analysis
 */
export function exportStats(stats) {
  return JSON.stringify(stats, null, 2);
}

/**
 * Import stats from backup
 */
export function importStats(jsonString) {
  try {
    const imported = JSON.parse(jsonString);
    if (imported.version === 2) {
      saveStats(imported);
      return imported;
    } else {
      throw new Error('Invalid stats version');
    }
  } catch (error) {
    console.error('Error importing stats:', error);
    throw error;
  }
}
