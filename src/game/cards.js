/**
 * Card utility functions for Blackjack
 */

export const ranks = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

export const suits = ["♠", "♥", "♦", "♣"];

export const isTenLike = (r) => r === "10" || r === "J" || r === "Q" || r === "K";

export const rankValue = (r) => (r === "A" ? 11 : isTenLike(r) ? 10 : parseInt(r, 10));

export const drawCard = () => ({
  rank: ranks[Math.floor(Math.random() * ranks.length)],
  suit: suits[Math.floor(Math.random() * suits.length)],
});

export const upcardValue = (c) =>
  c.rank === "A" ? 11 : isTenLike(c.rank) ? 10 : parseInt(c.rank, 10);

export function handTotals(cards) {
  let total = 0,
    aces = 0;
  for (const c of cards) {
    if (c.rank === "A") aces++;
    total += rankValue(c.rank) === 11 ? 1 : rankValue(c.rank);
  }
  let soft = undefined;
  if (aces > 0) {
    const cand = total + 10;
    if (cand <= 21) soft = cand;
  }
  return { hard: total, soft };
}

export const isPair = (cards) =>
  cards.length === 2 &&
  (cards[0].rank === cards[1].rank ||
    (isTenLike(cards[0].rank) && isTenLike(cards[1].rank)));

export const isSoft = (cards) => handTotals(cards).soft !== undefined;
