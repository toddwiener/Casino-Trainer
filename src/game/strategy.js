/**
 * Basic strategy functions for Blackjack (S17/DAS rules)
 */

import { isTenLike, handTotals, isPair, isSoft, upcardValue } from './cards.js';

export function softStrategy(total, up) {
  switch (total) {
    case 20:
      return "Stand";
    case 19:
      return up === 6 ? "Double" : "Stand";
    case 18:
      if (up >= 9 || up === 11) return "Hit";
      if (up >= 3 && up <= 6) return "Double";
      return "Stand";
    case 17:
      return up >= 3 && up <= 6 ? "Double" : "Hit";
    case 16:
      return up >= 4 && up <= 6 ? "Double" : "Hit";
    case 15:
      return up >= 4 && up <= 6 ? "Double" : "Hit";
    case 14:
      return up === 5 || up === 6 ? "Double" : "Hit";
    case 13:
      return up === 5 || up === 6 ? "Double" : "Hit";
    default:
      return "Hit";
  }
}

export function hardStrategy(total, up) {
  if (total >= 17) return "Stand";
  if (total >= 13 && total <= 16) return up >= 2 && up <= 6 ? "Stand" : "Hit";
  if (total === 12) return up >= 4 && up <= 6 ? "Stand" : "Hit";
  if (total === 11) return up === 11 ? "Hit" : "Double";
  if (total === 10) return up >= 2 && up <= 9 ? "Double" : "Hit";
  if (total === 9) return up >= 3 && up <= 6 ? "Double" : "Hit";
  return "Hit";
}

export function pairStrategy(r, up) {
  const val = isTenLike(r) ? 10 : r === "A" ? 11 : parseInt(r, 10);
  if (r === "A") return "Split";
  if (isTenLike(r)) return "Stand";
  if (val === 9) return up === 7 || up === 10 || up === 11 ? "Stand" : "Split";
  if (val === 8) return "Split";
  if (val === 7) return up >= 2 && up <= 7 ? "Split" : "Hit";
  if (val === 6) return up >= 2 && up <= 6 ? "Split" : "Hit";
  if (val === 5) return up >= 2 && up <= 9 ? "Double" : "Hit";
  if (val === 4) return up === 5 || up === 6 ? "Split" : "Hit";
  if (val === 3 || val === 2) return up >= 2 && up <= 7 ? "Split" : "Hit";
  return "Hit";
}

export function bestAction(player, upCard) {
  if (isPair(player))
    return {
      action: pairStrategy(player[0].rank, upcardValue(upCard)),
      category: "PAIR",
      note: "Pair strategy (S17/DAS)",
    };
  const totals = handTotals(player);
  if (isSoft(player))
    return {
      action: softStrategy(totals.soft, upcardValue(upCard)),
      category: "SOFT",
      note: `Soft total ${totals.soft}`,
    };
  return {
    action: hardStrategy(totals.hard, upcardValue(upCard)),
    category: "HARD",
    note: `Hard total ${totals.hard}`,
  };
}

export function bestActionNoSplit(player, upCard) {
  const totals = handTotals(player);
  if (isSoft(player))
    return {
      action: softStrategy(totals.soft, upcardValue(upCard)),
      category: "SOFT",
      note: `Soft total ${totals.soft}`,
    };
  return {
    action: hardStrategy(totals.hard, upcardValue(upCard)),
    category: "HARD",
    note: `Hard total ${totals.hard}`,
  };
}
