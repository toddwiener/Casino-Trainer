/**
 * EV Lookup Table Generator
 *
 * Generates a complete lookup table of Expected Value (EV) for all blackjack scenarios.
 * Run once to generate evLookup.json, then commit to repo.
 *
 * Usage: node src/utils/generateEVLookup.js
 *
 * Output: src/data/evLookup.json (~850KB)
 */

import { ranks, drawCard, handTotals, isPair, isSoft } from '../game/cards.js';
import { estimateEVStats } from '../game/simulation.js';
import { bestAction } from '../game/strategy.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Increase trials for more accurate results (5000 recommended, can use 10000 for production)
const TRIALS_PER_SCENARIO = 5000;

function makeKey(playerCards, dealerUpcard) {
  // Normalize key format: sort player ranks, dealer rank
  const p1 = playerCards[0].rank;
  const p2 = playerCards[1].rank;
  const d = dealerUpcard.rank;

  // Sort player cards for consistency (e.g., "A,8" same as "8,A")
  const sorted = [p1, p2].sort().join(',');
  return `${sorted}vs${d}`;
}

function getActions(playerCards) {
  // Determine which actions are possible for this hand
  const actions = ['Hit', 'Stand'];

  // Double is always possible on initial 2-card hand
  actions.push('Double');

  // Split only possible if pair
  if (isPair(playerCards)) {
    actions.push('Split');
  }

  return actions;
}

async function generateEVLookup() {
  console.log('Starting EV Lookup Table Generation...');
  console.log(`Trials per scenario: ${TRIALS_PER_SCENARIO}`);
  console.log('');

  const lookup = {};
  let totalScenarios = 0;
  let processed = 0;

  // Count total scenarios
  for (const r1 of ranks) {
    for (const r2 of ranks) {
      for (const d of ranks) {
        totalScenarios++;
      }
    }
  }

  console.log(`Total scenarios to process: ${totalScenarios}`);
  console.log('This will take approximately 5-10 minutes...\n');

  const startTime = Date.now();

  // Generate all combinations
  for (const r1 of ranks) {
    for (const r2 of ranks) {
      for (const d of ranks) {
        processed++;

        // Create hand
        const playerCards = [
          { rank: r1, suit: '♠' },  // Suit doesn't matter for strategy
          { rank: r2, suit: '♠' }
        ];
        const dealerUpcard = { rank: d, suit: '♠' };

        // Skip blackjack (21)
        const totals = handTotals(playerCards);
        const playerTotal = totals.soft ?? totals.hard;
        if (playerTotal === 21) {
          continue;
        }

        const key = makeKey(playerCards, dealerUpcard);

        // Get available actions
        const actions = getActions(playerCards);

        // Calculate EV for each action
        const evResults = {};
        for (const action of actions) {
          const stats = estimateEVStats(playerCards, dealerUpcard, action, TRIALS_PER_SCENARIO);
          evResults[action] = stats;
        }

        // Find best action and second-best
        const sortedActions = actions
          .map(a => ({ action: a, ev: evResults[a].ev }))
          .sort((a, b) => b.ev - a.ev);

        const bestActionName = sortedActions[0].action;
        const bestEV = sortedActions[0].ev;
        const secondBestEV = sortedActions.length > 1 ? sortedActions[1].ev : bestEV;
        const evDelta = Math.abs(bestEV - secondBestEV);

        // Get basic strategy action for comparison
        const strategyResult = bestAction(playerCards, dealerUpcard);

        // Store in lookup
        lookup[key] = {
          playerHand: `${r1},${r2}`,
          dealerUp: d,
          category: strategyResult.category,
          total: playerTotal,
          isSoft: isSoft(playerCards),
          isPair: isPair(playerCards),
          bestAction: bestActionName,
          evValues: evResults,
          evDelta: evDelta,
          strategyAction: strategyResult.action,
          matchesStrategy: bestActionName === strategyResult.action
        };

        // Progress indicator every 50 scenarios
        if (processed % 50 === 0) {
          const elapsed = (Date.now() - startTime) / 1000;
          const rate = processed / elapsed;
          const remaining = (totalScenarios - processed) / rate;
          console.log(`Progress: ${processed}/${totalScenarios} (${Math.round(processed/totalScenarios*100)}%) - Est. ${Math.round(remaining)}s remaining`);
        }
      }
    }
  }

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  console.log(`\nGeneration complete!`);
  console.log(`Time: ${Math.round(duration)}s`);
  console.log(`Scenarios generated: ${Object.keys(lookup).length}`);

  // Write to file
  const outputPath = path.join(__dirname, '../data/evLookup.json');
  fs.writeFileSync(outputPath, JSON.stringify(lookup, null, 2));

  const fileSize = fs.statSync(outputPath).size;
  console.log(`Output: ${outputPath}`);
  console.log(`Size: ${Math.round(fileSize / 1024)}KB`);

  // Verify strategy matches
  const total = Object.keys(lookup).length;
  const matches = Object.values(lookup).filter(v => v.matchesStrategy).length;
  const mismatches = total - matches;

  console.log(`\nStrategy Verification:`);
  console.log(`  Matches basic strategy: ${matches}/${total} (${Math.round(matches/total*100)}%)`);
  console.log(`  Mismatches: ${mismatches} (may be due to Monte Carlo variance or edge cases)`);

  if (mismatches > 0) {
    console.log(`\nSample mismatches (first 5):`);
    let count = 0;
    for (const [key, value] of Object.entries(lookup)) {
      if (!value.matchesStrategy && count < 5) {
        console.log(`  ${key}: Monte Carlo best=${value.bestAction}, Strategy=${value.strategyAction}, ΔEV=${value.evDelta.toFixed(4)}`);
        count++;
      }
    }
  }

  console.log('\nDone! You can now use this file in your app.');
  console.log('Commit evLookup.json to your repo to avoid regenerating.');
}

// Run generator
generateEVLookup().catch(err => {
  console.error('Error generating EV lookup:', err);
  process.exit(1);
});
