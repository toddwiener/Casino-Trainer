/**
 * EV hints and explanations for specific blackjack decisions
 */

export const EV_HINTS = {
  "HARD-12-2": {
    edge: "small",
    blurb:
      "12 vs 2 is close. Hitting slightly improves outcomes that would otherwise die when the dealer makes 20+.",
  },
  "HARD-12-3": {
    edge: "small",
    blurb:
      "12 vs 3 is similar—standing leaves too many losing totals when dealer improves.",
  },
  "HARD-16-10": {
    edge: "small",
    blurb:
      "16 vs 10: you're a big underdog; hitting loses often but saves you when dealer has small cards. Standing only beats a dealer bust.",
  },
  "HARD-15-10": {
    edge: "small",
    blurb:
      "15 vs 10: same logic as 16 vs 10; hitting has a slight edge over freezing at 15.",
  },
  "SOFT-18-9": {
    edge: "small",
    blurb:
      "A,7 vs 9: hitting avoids being stuck on 18 when dealer often makes 19+.",
  },
  "SOFT-18-10": {
    edge: "small",
    blurb:
      "A,7 vs 10: you'll lose to many 19/20s—hitting helps capture 19–21s.",
  },
  "SOFT-18-11": {
    edge: "small",
    blurb:
      "A,7 vs A: hitting is slightly better; standing loses too often to 19–21.",
  },
  "HARD-11-11": {
    edge: "small",
    blurb:
      "11 vs A under S17: hitting edges double because double forces you to stop with one card while paying double when you lose.",
  },
  "PAIR-9-7": {
    edge: "small",
    blurb:
      "9,9 vs 7: standing on 18 beats splitting; many dealer 17s push split lines into awkward totals.",
  },
  "PAIR-9-10": {
    edge: "small",
    blurb:
      "9,9 vs 10: stand; splitting against a 10 exposes two weak hands to strong dealer outcomes.",
  },
  "PAIR-9-11": {
    edge: "small",
    blurb:
      "9,9 vs A: stand; splitting performs worse against strong dealer ace starts.",
  },
  "PAIR-4-5": {
    edge: "small",
    blurb:
      "4,4 vs 5: splitting lets you double more often and avoid weak totals; close but favorable.",
  },
  "PAIR-4-6": {
    edge: "small",
    blurb:
      "4,4 vs 6: similar idea; splitting opens strong double opportunities.",
  },
};

export function edgeToText(edge) {
  if (edge === "large") return "ΔEV ≈ large (~5%+)";
  if (edge === "medium") return "ΔEV ≈ moderate (~2–4%)";
  return "ΔEV ≈ small (~1%)";
}

export function tipForContext(ctx) {
  if (!ctx) return null;
  if (ctx.category === "PAIR" && ctx.pairRank === "A")
    return "Tip: Always split A,A.";
  if (ctx.category === "PAIR" && ctx.pairRank === "8")
    return "Tip: Always split 8,8.";
  if (ctx.category === "PAIR" && ctx.pairRank === "10")
    return "Tip: Don't split 10s (keep 20).";
  if (ctx.category === "HARD" && ctx.total === 11 && ctx.up !== 11)
    return "Tip: Double 11 against 2–10 (S17).";
  if (ctx.category === "HARD" && ctx.total === 12)
    return "Tip: Hard 12 — stand vs 4–6, otherwise hit.";
  if (ctx.category === "HARD" && ctx.total === 16 && ctx.up === 10)
    return "Tip: 16 vs 10 — hit (or surrender where allowed).";
  if (ctx.category === "SOFT" && ctx.total === 18)
    return "Tip: Soft 18 — double vs 3–6, stand vs 2/7/8, hit vs 9/10/A.";
  return null;
}

export function decisionKeyFromCtx(ctx) {
  if (!ctx) return "";
  const { category, total, pairRank, up } = ctx;
  if (category === "PAIR") return `PAIR-${pairRank}-${up}`;
  if (category === "SOFT") return `SOFT-${total}-${up}`;
  return `HARD-${total}-${up}`;
}
