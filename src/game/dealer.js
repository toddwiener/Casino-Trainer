/**
 * Dealer logic and player resolution for Blackjack
 */

import { drawCard, handTotals } from './cards.js';
import { bestAction, bestActionNoSplit } from './strategy.js';

function card() {
  return drawCard();
}

export function bestTotal(hand) {
  const t = handTotals(hand);
  return t.soft !== undefined ? t.soft : t.hard;
}

export function isBustHand(hand) {
  return handTotals(hand).hard > 21;
}

/**
 * Dealer plays out their hand according to S17 rules
 * (Stand on soft 17)
 */
export function dealerResolve(up) {
  const dealer = [up, card()];
  while (true) {
    const t = handTotals(dealer);
    const total = t.soft ?? t.hard;
    const soft = t.soft !== undefined && t.soft === total;
    if (total >= 17 && !(soft && total === 17)) break; // S17 stands on soft 17
    dealer.push(card());
    if (handTotals(dealer).hard > 21) break;
  }
  return bestTotal(dealer);
}

function policyAction(hand, up, allowDouble, allowSplit) {
  const actionObj = allowSplit
    ? bestAction(hand, up)
    : bestActionNoSplit(hand, up);
  let act = actionObj.action;
  if (act === "Double" && !allowDouble) act = "Hit";
  if (act === "Split" && !allowSplit) act = bestActionNoSplit(hand, up).action;
  return act;
}

/**
 * Recursively resolves player's hand according to basic strategy
 */
export function resolvePlayer(hand, up, allowDouble = true, allowSplit = false) {
  let bet = 1;
  while (true) {
    const act = policyAction(hand, up, allowDouble, allowSplit);
    if (act === "Stand") return { hand, bet };
    if (act === "Hit") {
      hand.push(card());
      allowDouble = false;
      if (isBustHand(hand)) return { hand, bet };
    } else if (act === "Double") {
      hand.push(card());
      bet = 2;
      return { hand, bet };
    } else if (act === "Split") {
      const h1 = [hand[0], card()];
      const h2 = [hand[1], card()];
      const r1 = resolvePlayer(h1, up, true, false);
      const r2 = resolvePlayer(h2, up, true, false);
      return { split: [r1, r2] };
    }
  }
}
