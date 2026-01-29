/**
 * Dynamic EV-based difficulty classification
 *
 * Replaces hardcoded difficulty with actual EV deltas from lookup table
 */

import evLookup from '../data/evLookup.json';

// EV delta thresholds for difficulty classification
const THRESHOLDS = {
  HARD: 0.02,    // < 2% EV difference (nearly 50/50 decisions)
  MEDIUM: 0.05,  // 2-5% EV difference (moderate advantage)
  EASY: 0.05     // > 5% EV difference (clear advantage)
};

/**
 * Create lookup key from player hand and dealer upcard
 * Format: "rank1,rank2vsdealerRank" (ranks sorted)
 */
function makeKey(playerCards, dealerUpcard) {
  const p1 = playerCards[0].rank;
  const p2 = playerCards[1].rank;
  const d = dealerUpcard.rank;

  // Sort player cards for consistency
  const sorted = [p1, p2].sort().join(',');
  return `${sorted}vs${d}`;
}

/**
 * Classify scenario difficulty based on EV delta
 */
export function classifyDifficulty(playerCards, dealerUpcard) {
  const key = makeKey(playerCards, dealerUpcard);
  const data = evLookup[key];

  if (!data) {
    // Fallback to medium if not in lookup (shouldn't happen for valid hands)
    console.warn(`No EV data for ${key}, defaulting to Medium difficulty`);
    return 'Medium';
  }

  const evDelta = Math.abs(data.evDelta);

  if (evDelta < THRESHOLDS.HARD) {
    return 'Hard';
  }
  if (evDelta < THRESHOLDS.MEDIUM) {
    return 'Medium';
  }
  return 'Easy';
}

/**
 * Get detailed EV information for a scenario
 */
export function getScenarioEVInfo(playerCards, dealerUpcard) {
  const key = makeKey(playerCards, dealerUpcard);
  return evLookup[key] || null;
}

/**
 * Generate a random scenario with target difficulty
 */
export function generateScenarioWithDifficulty(mode, maxAttempts = 400) {
  const keys = Object.keys(evLookup);
  let attempts = 0;

  // Filter scenarios by difficulty
  const candidates = keys.filter(key => {
    const data = evLookup[key];
    const difficulty = classifyDifficulty(
      [{ rank: data.playerHand.split(',')[0] }, { rank: data.playerHand.split(',')[1] }],
      { rank: data.dealerUp }
    );
    return difficulty === mode;
  });

  if (candidates.length === 0) {
    console.warn(`No scenarios found for difficulty ${mode}, using random`);
    return generateRandomScenario();
  }

  // Special handling for Hard mode: reduce over-representation of Hard 12
  const filteredCandidates = mode === 'Hard'
    ? candidates.filter(key => {
        const data = evLookup[key];
        const dealerValue = data.dealerUp === 'A' ? 11 :
          ['10', 'J', 'Q', 'K'].includes(data.dealerUp) ? 10 :
          parseInt(data.dealerUp, 10);

        // Reduce Hard 12 vs 2/3 frequency
        if (data.category === 'HARD' && data.total === 12 && (dealerValue === 2 || dealerValue === 3)) {
          return Math.random() > 0.5; // 50% chance to skip
        }
        return true;
      })
    : candidates;

  const finalCandidates = filteredCandidates.length > 0 ? filteredCandidates : candidates;

  // Pick random scenario from candidates
  const randomKey = finalCandidates[Math.floor(Math.random() * finalCandidates.length)];
  const data = evLookup[randomKey];

  // Convert back to card objects
  const [r1, r2] = data.playerHand.split(',');
  return {
    player: [
      { rank: r1, suit: '♠' },
      { rank: r2, suit: '♠' }
    ],
    dealerUp: { rank: data.dealerUp, suit: '♠' }
  };
}

/**
 * Generate a completely random scenario (fallback)
 */
function generateRandomScenario() {
  const keys = Object.keys(evLookup);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  const data = evLookup[randomKey];

  const [r1, r2] = data.playerHand.split(',');
  return {
    player: [
      { rank: r1, suit: '♠' },
      { rank: r2, suit: '♠' }
    ],
    dealerUp: { rank: data.dealerUp, suit: '♠' }
  };
}

/**
 * Get statistics about difficulty distribution
 */
export function getDifficultyStats() {
  const stats = { Easy: 0, Medium: 0, Hard: 0 };

  for (const [key, data] of Object.entries(evLookup)) {
    const [r1, r2] = data.playerHand.split(',');
    const difficulty = classifyDifficulty(
      [{ rank: r1 }, { rank: r2 }],
      { rank: data.dealerUp }
    );
    stats[difficulty]++;
  }

  const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
  return {
    ...stats,
    total,
    percentages: {
      Easy: Math.round((stats.Easy / total) * 100),
      Medium: Math.round((stats.Medium / total) * 100),
      Hard: Math.round((stats.Hard / total) * 100)
    }
  };
}
