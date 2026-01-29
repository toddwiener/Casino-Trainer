/**
 * Monte Carlo EV simulation for Blackjack decisions
 * (S17, DAS, infinite shoe)
 */

import { drawCard } from './cards.js';
import { dealerResolve, resolvePlayer, bestTotal, isBustHand } from './dealer.js';

function card() {
  return drawCard();
}

function evalOutcome(playerBest, dealerBest) {
  if (playerBest > 21) return -1;
  if (dealerBest > 21) return 1;
  if (playerBest > dealerBest) return 1;
  if (playerBest < dealerBest) return -1;
  return 0;
}

/**
 * Recursively flatten split results to handle nested splits
 * Fixes bug where r1.hand is undefined when structure is r1.split
 */
export function flattenSplitResult(result) {
  // Recursively flatten split results to handle nested splits
  if (result.hand !== undefined) {
    // Base case: single hand
    return [{ hand: result.hand, bet: result.bet || 1 }];
  }
  if (result.split) {
    // Recursive case: split into multiple hands
    const left = flattenSplitResult(result.split[0]);
    const right = flattenSplitResult(result.split[1]);
    return [...left, ...right];
  }
  // Fallback for unexpected structure
  return [{ hand: [], bet: 1 }];
}

/**
 * Simulate one trial of a given action
 */
export function simulateEVOnce(origHand, up, initialAction) {
  const hand = JSON.parse(JSON.stringify(origHand));
  if (initialAction === "Stand") {
    const dealerBest = dealerResolve(up);
    return { w: evalOutcome(bestTotal(hand), dealerBest), b: 1 };
  }
  if (initialAction === "Hit") {
    hand.push(card());
    if (isBustHand(hand)) return { w: -1, b: 1 };
    const r = resolvePlayer(hand, up, false, false);
    const dealerBest = dealerResolve(up);
    const res = evalOutcome(bestTotal(r.hand), dealerBest) * (r.bet || 1);
    return { w: res, b: r.bet || 1 };
  }
  if (initialAction === "Double") {
    hand.push(card());
    const dealerBest = dealerResolve(up);
    const res = evalOutcome(bestTotal(hand), dealerBest) * 2;
    return { w: res, b: 2 };
  }
  if (initialAction === "Split") {
    const h1 = [hand[0], card()];
    const h2 = [hand[1], card()];
    const r1 = resolvePlayer(h1, up, true, false);
    const r2 = resolvePlayer(h2, up, true, false);
    const dealerBest = dealerResolve(up);

    // Flatten split results to handle nested splits
    const hands1 = flattenSplitResult(r1);
    const hands2 = flattenSplitResult(r2);
    const allHands = [...hands1, ...hands2];

    let totalWin = 0, totalBet = 0;
    for (const h of allHands) {
      totalWin += evalOutcome(bestTotal(h.hand), dealerBest) * h.bet;
      totalBet += h.bet;
    }
    return { w: totalWin, b: totalBet };
  }
  return { w: 0, b: 1 };
}

/**
 * Estimate EV statistics for a given action via Monte Carlo simulation
 */
export function estimateEVStats(origHand, up, action, trials = 1500) {
  let sum = 0,
    betsum = 0,
    wins = 0,
    pushes = 0,
    losses = 0;
  for (let i = 0; i < trials; i++) {
    const { w, b } = simulateEVOnce(origHand, up, action);
    sum += w;
    betsum += b;
    if (w > 0) wins++;
    else if (w === 0) pushes++;
    else losses++;
  }
  return {
    ev: sum / trials,
    wr: wins / trials,
    pr: pushes / trials,
    lr: losses / trials,
    avgBet: betsum / trials,
  };
}
