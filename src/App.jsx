import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Repeat,
  HelpCircle,
  Info,
  Flame,
  Settings,
  Square,
  Undo2,
  BookOpen,
  RotateCcw,
} from "lucide-react";
import evLookup from "./data/evLookup.json";

// =============================================
//  Casino Trainer — Blackjack Trainer (single-file React, JS)
//  • Modern UI (inline CSS)
//  • Multi-step play (Hit/Stand/Double/Split)
//  • Per-move feedback + end-of-hand summary with pause
//  • Accurate streak/best tracking, per-hand scoring
//  • Difficulty buckets focus on true close calls
//  • Settings popover (Auto-advance, Hold on mistakes, Theme)
//  • Undo with streak reset + streak flash animation
//  • "More info" panel with rationale + on-demand EV simulation (fast Monte Carlo)
// =============================================

// ---------- Inline CSS ----------
const styles = `
:root{ --bg1:#0d1117; --bg2:#111827; --panel:#ffffff; --ink:#101418; --muted:#5f6b7a; --brand:#10b981; --brand-ink:#059669; --outline:#e7ecef; --table:#f6faf8; --shadow:0 20px 40px rgba(0,0,0,.15), 0 8px 16px rgba(0,0,0,.08); }
*{box-sizing:border-box}
html{height:100%;-webkit-text-size-adjust:100%}
body{margin:0;padding:0;min-height:100%;font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";overflow-x:hidden}
#root{min-height:100vh;min-height:-webkit-fill-available;display:flex;flex-direction:column}
.ct-wrap{flex:1;display:flex;flex-direction:column;color:var(--ink);padding:20px;background:linear-gradient(180deg,var(--bg1),var(--bg2))}
.ct-wrap.light{--bg1:#f6f9fc; --bg2:#eef3f7; --panel:#ffffff; --ink:#0b1218; --muted:#55616f; --table:#ffffff}
.ct-container{max-width:1200px;width:100%;margin:0 auto;background:rgba(255,255,255,0.95);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.3);border-radius:18px;box-shadow:var(--shadow);padding:16px;position:relative;overflow:hidden;min-height:100%}
.header{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:6px}
.brand{display:flex;align-items:center;gap:8px;font-weight:800;font-size:19px}
.pill{display:inline-flex;align-items:center;gap:5px;padding:5px 9px;border-radius:999px;background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1px solid rgba(16,185,129,0.2);color:#065f46;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.rules{display:flex;align-items:center;gap:6px;color:var(--muted);font-size:12px;margin:6px 0 10px}
.table{background:linear-gradient(135deg,#f9fafb,#ffffff);border-radius:14px;padding:14px;border:1px solid var(--outline);box-shadow:inset 0 1px 2px rgba(0,0,0,.02)}
.grid{display:grid;grid-template-columns:200px 1fr;gap:14px;align-items:start}
.section h4{margin:0 0 6px 0;font-size:12px;color:#2b3943}
.cardrow{display:flex;gap:8px;flex-wrap:wrap}
.card{width:64px;height:92px;border-radius:10px;background:linear-gradient(145deg,#ffffff,#f9fafb);border:1px solid #dde6ea;box-shadow:0 4px 12px rgba(0,0,0,.06), inset 0 -1px 2px rgba(0,0,0,.02);display:flex;flex-direction:column;justify-content:space-between;align-items:center;padding:6px;transition:transform 0.2s ease}
.card:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(0,0,0,.1)}
.card.red{color:#b10e2a}
.card .rank{font-weight:800;font-size:13px}
.card .pip{font-size:24px}
.card .rank-btm{font-weight:800;font-size:13px;transform:rotate(180deg)}
.card.back{background:repeating-linear-gradient(45deg,#c0ced0,#c0ced0 7px,#b3c4c7 7px,#b3c4c7 14px);border-color:#a8babd}
.actions{display:grid;grid-template-columns:repeat(5,minmax(100px,1fr));gap:8px;margin-top:10px}
.btn{padding:9px 10px;border-radius:10px;border:1px solid var(--outline);background:linear-gradient(180deg,#ffffff,#f9fafb);font-weight:700;font-size:13px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.05);transition:all 0.15s cubic-bezier(0.4,0,0.2,1)}
.btn:hover{transform:translateY(-1px);box-shadow:0 4px 8px rgba(0,0,0,.1)}
.btn.primary{background:linear-gradient(135deg,#10b981,#059669);color:white;border-color:transparent;box-shadow:0 2px 8px rgba(16,185,129,0.3)}
.btn.primary:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(16,185,129,0.4)}
.btn.disabled{opacity:.45;cursor:not-allowed}
.kbd-hint{font-size:10px;opacity:0.5;margin-left:5px;font-weight:500}
.feedback{min-height:28px;display:flex;align-items:center;gap:8px;margin-top:10px}
.small{font-size:11px;color:#5f6b7a}
.footer{margin-top:12px;color:#5a6875;font-size:11px}
.select{padding:5px 9px;border-radius:9px;border:1px solid var(--outline);background:#fff;color:var(--ink);font-weight:600;font-size:13px;font-family:inherit}
.stats{display:flex;gap:8px;align-items:center}
.stats-bar{position:sticky;top:0;z-index:5;background:linear-gradient(135deg,rgba(255,255,255,0.98),rgba(249,250,251,0.98));backdrop-filter:blur(12px);border-bottom:1px solid var(--outline);border-radius:12px 12px 0 0;margin:-16px -16px 12px -16px;padding:10px 16px;display:flex;justify-content:space-around;align-items:center;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.stat-group{display:flex;flex-direction:column;align-items:center;gap:2px}
.stat-value{font-size:16px;font-weight:800;color:var(--ink)}
.stat-label{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px}
.stat-divider{width:1px;height:32px;background:var(--outline)}
.hands{display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap}
.hand{padding:8px;border:1px solid var(--outline);border-radius:12px;background:#fff}
.hand.active{outline:2px solid var(--brand);outline-offset:1px}
.badge{font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px;border:1px solid var(--outline);background:#f7fbfa;color:#2b3943;display:inline-flex;gap:5px;align-items:center}
.sep{height:1px;background:#eef2f4;margin:10px 0}

/* Settings popover */
.settings-pop{position:absolute;top:52px;right:14px;background:#fff;border:1px solid var(--outline);border-radius:10px;box-shadow:var(--shadow);padding:10px 10px;min-width:260px;z-index:10}
.settings-row{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:5px 0}
.settings-title{font-weight:800;font-size:13px;margin-bottom:3px}

/* Strategy Sheet Modal */
.strategy-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px}
.strategy-modal{background:#fff;border-radius:16px;box-shadow:var(--shadow);max-width:1100px;width:100%;max-height:90vh;overflow-y:auto;position:relative}
.strategy-header{position:sticky;top:0;background:linear-gradient(135deg,#10b981,#059669);color:white;padding:16px 20px;border-radius:16px 16px 0 0;display:flex;justify-content:space-between;align-items:center;z-index:1}
.strategy-header h2{margin:0;font-size:20px;font-weight:800}
.strategy-close{background:rgba(255,255,255,0.2);border:none;color:white;font-size:24px;cursor:pointer;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;transition:background 0.2s}
.strategy-close:hover{background:rgba(255,255,255,0.3)}
.strategy-content{padding:20px}
.strategy-section{margin-bottom:24px}
.strategy-section:last-child{margin-bottom:0}
.strategy-section h3{margin:0 0 12px 0;font-size:16px;font-weight:700;color:var(--ink)}
.strategy-table{width:100%;border-collapse:collapse;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08)}
.strategy-table th,.strategy-table td{padding:8px 6px;text-align:center;border:1px solid var(--outline);font-weight:600}
.strategy-table thead th{background:linear-gradient(135deg,#f9fafb,#f3f4f6);color:var(--ink);font-weight:800;position:sticky;top:0;z-index:1}
.strategy-table tbody th{background:linear-gradient(135deg,#f9fafb,#f3f4f6);color:var(--ink);font-weight:800}
.strategy-table td.hit{background:linear-gradient(135deg,#fef3c7,#fde68a);color:#78350f}
.strategy-table td.stand{background:linear-gradient(135deg,#d1fae5,#a7f3d0);color:#065f46}
.strategy-table td.double{background:linear-gradient(135deg,#dbeafe,#bfdbfe);color:#1e40af}
.strategy-table td.split{background:linear-gradient(135deg,#fce7f3,#fbcfe8);color:#831843}
.strategy-legend{display:flex;gap:12px;flex-wrap:wrap;margin-top:16px;padding:12px;background:#f9fafb;border-radius:8px}
.strategy-legend-item{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600}
.strategy-legend-box{width:20px;height:20px;border-radius:4px;border:1px solid rgba(0,0,0,0.1)}

/* Inline feedback (replaces modal) */
.inline-feedback{margin-top:10px;background:linear-gradient(135deg,#fef2f2,#fff);border-left:4px solid #ef4444;border-radius:10px;padding:10px 12px;box-shadow:0 3px 12px rgba(239,68,68,.12);overflow:hidden}
.inline-feedback-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-weight:800;font-size:13px}
.close-btn{background:none;border:none;font-size:22px;cursor:pointer;opacity:0.6;line-height:1;padding:0;width:22px;height:22px}
.close-btn:hover{opacity:1}
.explanation-text{margin:6px 0;font-size:12px;line-height:1.5}
.tip-highlight{background:#fef3c7;border-left:3px solid #f59e0b;padding:6px 8px;margin:6px 0;border-radius:5px;font-weight:600;font-size:12px}
.ev-stats{background:#f8fafc;border-radius:7px;padding:6px 8px;margin-top:6px;font-size:11px}
.ev-row{display:flex;justify-content:space-between;gap:6px;margin:3px 0}
.delta{font-weight:800;color:#dc2626}

/* Mobile responsive breakpoints */
@media (max-width: 768px) {
  .ct-wrap{padding:10px}
  .ct-container{padding:10px;border-radius:16px;max-width:100%}
  .strategy-overlay{padding:10px}
  .strategy-modal{max-height:95vh}
  .strategy-header{padding:12px 16px}
  .strategy-header h2{font-size:16px}
  .strategy-content{padding:16px}
  .strategy-section{margin-bottom:20px}
  .strategy-section h3{font-size:14px;margin-bottom:10px}
  .strategy-table{font-size:10px}
  .strategy-table th,.strategy-table td{padding:6px 4px}
  .strategy-legend{gap:8px;padding:10px;margin-top:12px}
  .strategy-legend-item{font-size:11px}
  .strategy-legend-box{width:18px;height:18px}
  .stats-bar{margin:-10px -10px 8px -10px;padding:6px 10px;flex-wrap:wrap;gap:6px}
  .stat-group{gap:1px}
  .stat-value{font-size:13px}
  .stat-label{font-size:8px}
  .stat-divider{height:20px}
  .brand{font-size:15px}
  .header{margin-bottom:4px}
  .rules{margin:4px 0 8px;font-size:11px}
  .grid{grid-template-columns:1fr;gap:10px}
  .section h4{font-size:10px;margin-bottom:4px}
  .table{padding:10px}
  .card{width:50px;height:72px;padding:4px}
  .card .rank{font-size:11px}
  .card .pip{font-size:18px}
  .card .rank-btm{font-size:11px}
  .cardrow{gap:6px}
  .actions{grid-template-columns:repeat(2,1fr);gap:6px;margin-top:8px}
  .btn{padding:8px 6px;font-size:11px;min-height:40px}
  .kbd-hint{font-size:9px}
  .feedback{min-height:24px;margin-top:8px;gap:6px}
  .sep{margin:8px 0}
  .stats{flex-wrap:wrap;gap:6px;justify-content:center}
  .footer{display:none}
  .settings-pop{right:8px;min-width:220px;top:46px}
  .inline-feedback{margin-top:8px;padding:8px 10px}
  .inline-feedback-header{font-size:12px;margin-bottom:4px}
  .explanation-text{font-size:11px;margin:4px 0}
  .tip-highlight{padding:5px 7px;font-size:11px;margin:4px 0}
  .ev-stats{padding:5px 7px;margin-top:4px;font-size:10px}
  .hand{padding:6px}
}

@media (max-width: 640px) {
  html{height:100%;height:-webkit-fill-available}
  body{height:100%;height:-webkit-fill-available}
  #root{height:100%;height:-webkit-fill-available}
  .ct-wrap{padding:6px;height:100%;height:-webkit-fill-available}
  .ct-container{padding:8px;width:calc(100% - 0px);overflow-x:hidden;min-height:100%}
  .strategy-overlay{padding:6px}
  .strategy-header{padding:10px 12px}
  .strategy-header h2{font-size:14px}
  .strategy-content{padding:12px}
  .strategy-section{margin-bottom:16px}
  .strategy-section h3{font-size:13px}
  .strategy-table{font-size:9px}
  .strategy-table th,.strategy-table td{padding:5px 3px}
  .stats-bar{margin:-8px -8px 6px -8px;padding:5px 8px}
  .header{flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:8px}
  .brand{font-size:14px;flex:1 1 100%;text-align:center;order:1}
  .stats{width:100%;justify-content:center;order:2;gap:10px}
  .select{padding:6px 10px;font-size:13px;min-width:100px;font-weight:600}
  .btn{padding:8px 10px;font-size:12px}
  .rules{flex-wrap:wrap;font-size:10px;justify-content:center;margin:3px 0 6px}
  .grid{display:flex;flex-direction:column;gap:8px}
  .table{padding:8px}
  .card{width:46px;height:66px;padding:3px}
  .card .rank{font-size:10px}
  .card .pip{font-size:16px}
  .card .rank-btm{font-size:10px}
  .cardrow{gap:5px}
  .actions{grid-template-columns:repeat(2,1fr);gap:5px;margin-top:6px}
  .btn{min-height:38px;padding:8px 6px;font-size:11px}
  .feedback{margin-top:6px}
  .hand{padding:5px}
  .badge{font-size:9px;padding:2px 6px}
}

@media (max-width: 480px) {
  html{height:100%;height:-webkit-fill-available}
  body{height:100%;height:-webkit-fill-available}
  #root{height:100%;height:-webkit-fill-available}
  .ct-wrap{padding:4px;height:100%;height:-webkit-fill-available}
  .ct-container{padding:6px;border-radius:12px;width:calc(100% - 0px);min-height:100%}
  .stats-bar{padding:4px 6px}
  .stat-value{font-size:12px}
  .stat-label{font-size:7px}
  .card{width:42px;height:60px}
  .cardrow{gap:4px}
  .actions{gap:4px;margin-top:5px}
  .inline-feedback{padding:6px 8px}
  .tip-highlight{padding:4px 6px}
}
`;

// ---------- Game helpers (JS) ----------
const ranks = [
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
const suits = ["♠", "♥", "♦", "♣"];
const isTenLike = (r) => r === "10" || r === "J" || r === "Q" || r === "K";
const rankValue = (r) => (r === "A" ? 11 : isTenLike(r) ? 10 : parseInt(r, 10));
const drawCard = () => ({
  rank: ranks[Math.floor(Math.random() * ranks.length)],
  suit: suits[Math.floor(Math.random() * suits.length)],
});
const upcardValue = (c) =>
  c.rank === "A" ? 11 : isTenLike(c.rank) ? 10 : parseInt(c.rank, 10);

function handTotals(cards) {
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
const isPair = (cards) =>
  cards.length === 2 &&
  (cards[0].rank === cards[1].rank ||
    (isTenLike(cards[0].rank) && isTenLike(cards[1].rank)));
const isSoft = (cards) => handTotals(cards).soft !== undefined;

function softStrategy(total, up) {
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
function hardStrategy(total, up) {
  if (total >= 17) return "Stand";
  if (total >= 13 && total <= 16) return up >= 2 && up <= 6 ? "Stand" : "Hit";
  if (total === 12) return up >= 4 && up <= 6 ? "Stand" : "Hit";
  if (total === 11) return up === 11 ? "Hit" : "Double";
  if (total === 10) return up >= 2 && up <= 9 ? "Double" : "Hit";
  if (total === 9) return up >= 3 && up <= 6 ? "Double" : "Hit";
  return "Hit";
}
function pairStrategy(r, up) {
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
function bestAction(player, upCard) {
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
function bestActionNoSplit(player, upCard) {
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

// ---------- Difficulty classifier (probability-informed) ----------
function scenarioDifficulty(player, up) {
  const uv = upcardValue(up);
  const totals = handTotals(player);
  const pair = isPair(player);
  const soft = isSoft(player);
  const pr = pair ? (isTenLike(player[0].rank) ? "10" : player[0].rank) : null;

  if (
    (!pair && !soft && totals.hard === 12 && (uv === 2 || uv === 3)) ||
    (!pair &&
      !soft &&
      (totals.hard === 15 || totals.hard === 16) &&
      uv === 10) ||
    (!pair && soft && totals.soft === 18 && (uv >= 9 || uv === 11)) ||
    (pair && pr === "9" && (uv === 7 || uv === 10 || uv === 11)) ||
    (!pair && !soft && totals.hard === 11 && uv === 11) ||
    (pair && pr === "4" && (uv === 5 || uv === 6))
  )
    return "Hard";

  if (
    (pair &&
      (pr === "2" || pr === "3" || pr === "6" || pr === "7") &&
      uv >= 2 &&
      uv <= 7) ||
    (!pair && !soft && totals.hard === 12 && uv >= 4 && uv <= 6) ||
    (!pair && !soft && totals.hard === 9 && uv >= 3 && uv <= 6) ||
    (!pair && soft && totals.soft === 17 && uv >= 3 && uv <= 6) ||
    (!pair &&
      soft &&
      totals.soft === 18 &&
      (uv === 2 || uv === 7 || uv === 8)) ||
    (pair && pr === "8" && (uv === 9 || uv === 10 || uv === 11))
  )
    return "Medium";

  if (
    (pair && (pr === "A" || pr === "8")) ||
    (pair && (pr === "5" || pr === "10")) ||
    (!pair && !soft && totals.hard >= 17) ||
    (!pair && soft && totals.soft >= 19) ||
    (!pair && !soft && totals.hard <= 8) ||
    (!pair && !soft && totals.hard === 11 && uv !== 11) ||
    (!pair && !soft && totals.hard === 10 && uv >= 2 && uv <= 9) ||
    (!pair &&
      soft &&
      totals.soft >= 13 &&
      totals.soft <= 17 &&
      (((totals.soft === 13 || totals.soft === 14) && (uv === 5 || uv === 6)) ||
        ((totals.soft === 15 || totals.soft === 16) && uv >= 4 && uv <= 6) ||
        (totals.soft === 17 && uv >= 3 && uv <= 6))) ||
    (!pair &&
      !soft &&
      ((totals.hard >= 13 && totals.hard <= 16 && uv >= 2 && uv <= 6) ||
        (totals.hard === 12 && uv >= 4 && uv <= 6)))
  )
    return "Easy";

  return "Medium";
}

// ---------- Scenario generator ----------
function generateScenario(mode) {
  let p1, p2, dealer;
  let tries = 0;
  const totalVal = (a, b) => {
    const pv = (c) =>
      c.rank === "A" ? 11 : isTenLike(c.rank) ? 10 : parseInt(c.rank, 10);
    const base = (pv(a) === 11 ? 1 : pv(a)) + (pv(b) === 11 ? 1 : pv(b));
    return (a.rank === "A" || b.rank === "A") && base + 10 <= 21
      ? base + 10
      : base;
  };

  while (tries < 400) {
    p1 = drawCard();
    p2 = drawCard();
    dealer = drawCard();
    if (totalVal(p1, p2) === 21) {
      tries++;
      continue;
    }
    const diff = scenarioDifficulty([p1, p2], dealer);
    const matches =
      (mode === "Hard" && diff === "Hard") ||
      (mode === "Easy" && diff === "Easy") ||
      (mode === "Medium" && diff === "Medium");
    if (matches) {
      const t = handTotals([p1, p2]);
      const uv = upcardValue(dealer);
      const isOverRepHard =
        diff === "Hard" &&
        !isSoft([p1, p2]) &&
        t.hard === 12 &&
        (uv === 2 || uv === 3);
      if (!isOverRepHard || Math.random() > 0.5) break;
    }
    tries++;
  }
  return { player: [p1, p2], dealerUp: dealer };
}

// ---------- EV / Explanation helpers ----------
function decisionKeyFromCtx(ctx) {
  if (!ctx) return "";
  const { category, total, pairRank, up } = ctx;
  if (category === "PAIR") return `PAIR-${pairRank}-${up}`;
  if (category === "SOFT") return `SOFT-${total}-${up}`;
  return `HARD-${total}-${up}`;
}
const EV_HINTS = {
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
      "16 vs 10: you’re a big underdog; hitting loses often but saves you when dealer has small cards. Standing only beats a dealer bust.",
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
      "A,7 vs 10: you’ll lose to many 19/20s—hitting helps capture 19–21s.",
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
function edgeToText(edge) {
  if (edge === "large") return "ΔEV ≈ large (~5%+)";
  if (edge === "medium") return "ΔEV ≈ moderate (~2–4%)";
  return "ΔEV ≈ small (~1%)";
}
function tipForContext(ctx) {
  if (!ctx) return null;
  if (ctx.category === "PAIR" && ctx.pairRank === "A")
    return "Tip: Always split A,A.";
  if (ctx.category === "PAIR" && ctx.pairRank === "8")
    return "Tip: Always split 8,8.";
  if (ctx.category === "PAIR" && ctx.pairRank === "10")
    return "Tip: Don’t split 10s (keep 20).";
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

// ---------- Quick EV Monte Carlo (S17, DAS, infinite shoe) ----------
function card() {
  return drawCard();
}
function bestTotal(hand) {
  const t = handTotals(hand);
  return t.soft !== undefined ? t.soft : t.hard;
}
function isBustHand(hand) {
  return handTotals(hand).hard > 21;
}
function dealerResolve(up) {
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
function resolvePlayer(hand, up, allowDouble = true, allowSplit = false) {
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
function evalOutcome(playerBest, dealerBest) {
  if (playerBest > 21) return -1;
  if (dealerBest > 21) return 1;
  if (playerBest > dealerBest) return 1;
  if (playerBest < dealerBest) return -1;
  return 0;
}
function flattenSplitResult(result) {
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
function simulateEVOnce(origHand, up, initialAction) {
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
function estimateEVStats(origHand, up, action, trials = 1500) {
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

// ---------- UI Components ----------
const CardView = ({ card, hidden }) => (
  <motion.div
    className={`card ${
      !hidden && (card.suit === "♥" || card.suit === "♦") ? "red" : ""
    } ${hidden ? "back" : ""}`}
    initial={{ y: 8, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.25 }}
  >
    {hidden ? null : (
      <>
        <div className="rank">{card.rank}</div>
        <div className="pip">{card.suit}</div>
        <div className="rank-btm">{card.rank}</div>
      </>
    )}
  </motion.div>
);

const Pill = ({ children, flash = false }) => (
  <motion.span
    className="pill"
    animate={
      flash ? { backgroundColor: ["#f1f6f4", "#ffe4e4", "#f1f6f4"] } : {}
    }
    transition={{ duration: 0.8 }}
  >
    {children}
  </motion.span>
);
const Badge = ({ children }) => <span className="badge">{children}</span>;

// ---------- Main Component ----------
export default function CasinoTrainer() {
  // theme & sticky settings
  const [theme, setTheme] = useState(
    () => localStorage.getItem("ct_theme") || "dark"
  );
  const [holdOnMistakes, setHoldOnMistakes] = useState(() => {
    const v = localStorage.getItem("ct_hold_mistakes");
    return v === null ? true : v === "true";
  });

  const [mode, setMode] = useState("Easy");
  const [dealerUp, setDealerUp] = useState(null);
  const [hands, setHands] = useState([]);
  const [active, setActive] = useState(0);
  const [message, setMessage] = useState("");
  const [explanation, setExplanation] = useState("");
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(() =>
    parseInt(localStorage.getItem("bj_best_streak") || "0", 10)
  );
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [autoAdvanceMs, setAutoAdvanceMs] = useState(0);
  const [awaitingAdvance, setAwaitingAdvance] = useState(false);
  const [handScores, setHandScores] = useState([{ c: 0, t: 0 }]);
  const [locked, setLocked] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [history, setHistory] = useState([]);
  const [flashStreak, setFlashStreak] = useState(false);
  const [moreInfo, setMoreInfo] = useState(null);
  const [lastDecision, setLastDecision] = useState(null);
  const [evStats, setEvStats] = useState(null);
  const [evLoading, setEvLoading] = useState(false);
  const [showStrategySheet, setShowStrategySheet] = useState(false);
  const [strategyView, setStrategyView] = useState("action"); // "action" or "ev"

  function spawn(m = mode) {
    const s = generateScenario(m);
    setDealerUp(s.dealerUp);
    setHands([s.player]);
    setActive(0);
    setMessage("");
    setExplanation("");
    setHandScores([{ c: 0, t: 0 }]);
    setLocked(false);
    setHistory([]);
    setMoreInfo(null);
    setLastDecision(null);
    setAwaitingAdvance(false);
    setEvStats(null);
  }

  function resetStats() {
    if (confirm("Reset all statistics? This cannot be undone.")) {
      setStreak(0);
      setBestStreak(0);
      setTotalCorrect(0);
      setTotalAttempts(0);
      localStorage.setItem("bj_best_streak", "0");
    }
  }

  useEffect(() => {
    spawn(mode);
  }, []);
  useEffect(() => {
    spawn(mode);
  }, [mode]);

  const currentHand = hands[active] || [];
  const best = useMemo(
    () =>
      dealerUp && currentHand.length ? bestAction(currentHand, dealerUp) : null,
    [dealerUp, currentHand]
  );
  const isFirstMove = currentHand.length === 2;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignore keypresses in input/select elements
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      const key = e.key.toLowerCase();

      // Action shortcuts
      if (key === 'h' && !locked && !awaitingAdvance) {
        e.preventDefault();
        onChoose('Hit');
      } else if (key === 's' && !locked && !awaitingAdvance) {
        e.preventDefault();
        onChoose('Stand');
      } else if (key === 'd' && !locked && !awaitingAdvance) {
        e.preventDefault();
        onChoose('Double');
      } else if (key === 'p' && isPair(currentHand) && !locked && !awaitingAdvance) {
        e.preventDefault();
        onChoose('Split');
      }
      // Flow shortcuts
      else if ((key === ' ' || key === 'enter') && awaitingAdvance) {
        e.preventDefault();
        continueAdvance();
      } else if (key === 'n') {
        e.preventDefault();
        spawn();
      } else if (key === 'u' && history.length > 0 && !locked && !awaitingAdvance) {
        e.preventDefault();
        undo();
      }
      // UI shortcuts
      else if (key === 'escape') {
        e.preventDefault();
        setMoreInfo(null);
        setShowSettings(false);
        setShowStrategySheet(false);
      }
      // Strategy sheet toggle
      else if (key === '?' || key === '/') {
        e.preventDefault();
        setShowStrategySheet(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [locked, awaitingAdvance, currentHand, history.length]);

  function continueAdvance() {
    if (active < hands.length - 1) {
      setActive((prev) => prev + 1);
    } else {
      spawn();
    }
    setAwaitingAdvance(false);
  }

  function finishAndAdvance(lastMoveCorrect, finalScore, reason) {
    setLocked(true);
    const suffix = reason ? ` — ${reason}` : "";
    setMessage(
      `${lastMoveCorrect ? "✅ Correct" : "❌ Not quite"} · Hand finished — ${
        finalScore.c
      }/${finalScore.t} correct${suffix}`
    );
    const shouldHold = holdOnMistakes && !lastMoveCorrect;
    if (shouldHold) {
      setAwaitingAdvance(true);
      setLocked(false);
      return;
    }
    const delay = autoAdvanceMs > 0 ? autoAdvanceMs : 1800;
    setTimeout(() => {
      continueAdvance();
    }, delay);
  }

  function snapshot() {
    return {
      dealerUp,
      hands: JSON.parse(JSON.stringify(hands)),
      active,
      message,
      explanation,
      streak,
      totalCorrect,
      totalAttempts,
      handScores: JSON.parse(JSON.stringify(handScores)),
      lastDecision,
    };
  }

  function undo() {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setDealerUp(prev.dealerUp);
      setHands(prev.hands);
      setActive(prev.active);
      setMessage("↩️ Undid last move — streak reset");
      setExplanation(prev.explanation);
      setTotalCorrect(prev.totalCorrect);
      setTotalAttempts(prev.totalAttempts);
      setHandScores(prev.handScores);
      setLastDecision(prev.lastDecision);
      setStreak(0);
      setFlashStreak(true);
      setTimeout(() => setFlashStreak(false), 700);
      setAwaitingAdvance(false);
      return h.slice(0, -1);
    });
  }

  function onChoose(action) {
    if (!dealerUp || !best || locked || awaitingAdvance) return;

    setHistory((h) => [...h, snapshot()]);

    const totals = handTotals(currentHand);
    const ctx = isPair(currentHand)
      ? {
          category: "PAIR",
          total: null,
          pairRank: isTenLike(currentHand[0].rank) ? "10" : currentHand[0].rank,
          up: upcardValue(dealerUp),
          best: best.action,
        }
      : isSoft(currentHand)
      ? {
          category: "SOFT",
          total: totals.soft,
          pairRank: null,
          up: upcardValue(dealerUp),
          best: best.action,
        }
      : {
          category: "HARD",
          total: totals.hard,
          pairRank: null,
          up: upcardValue(dealerUp),
          best: best.action,
        };

    const moveCorrect = action === best.action;
    setLastDecision({
      ...ctx,
      chosen: action,
      correct: moveCorrect,
      first: isFirstMove,
    });

    setTotalAttempts((v) => v + 1);
    if (moveCorrect) {
      setTotalCorrect((v) => v + 1);
      setStreak((prev) => {
        const ns = prev + 1;
        setBestStreak((prevBest) => {
          const nb = Math.max(prevBest, ns);
          if (nb !== prevBest)
            localStorage.setItem("bj_best_streak", String(nb));
          return nb;
        });
        return ns;
      });
    } else {
      setStreak(0);
      setFlashStreak(true);
      setTimeout(() => setFlashStreak(false), 700);
      // Automatically show inline feedback for wrong answers
      setMoreInfo({ visible: true });
    }

    const curr = handScores[active] || { c: 0, t: 0 };
    const updatedScore = { c: curr.c + (moveCorrect ? 1 : 0), t: curr.t + 1 };
    setHandScores((arr) =>
      arr.map((s, i) => (i === active ? updatedScore : s))
    );

    const handLabel = isPair(currentHand)
      ? `Pair of ${
          currentHand[0].rank === "10" || isTenLike(currentHand[0].rank)
            ? "10s"
            : currentHand[0].rank
        }s`
      : isSoft(currentHand)
      ? `Soft ${totals.soft}`
      : `Hard ${totals.hard}`;
    const dealerLabel =
      dealerUp.rank === "A"
        ? "A"
        : isTenLike(dealerUp.rank)
        ? "10"
        : dealerUp.rank;
    setExplanation(
      `${handLabel} vs dealer ${dealerLabel}. Best: ${best.action}. ${best.note}`
    );

    if (action === "Hit") {
      const nc = drawCard();
      const updatedHands = hands.map((h, i) => (i === active ? [...h, nc] : h));
      setHands(updatedHands);
      const { hard } = handTotals([...currentHand, nc]);
      if (hard > 21) {
        setMessage(moveCorrect ? "✅ Correct — Bust" : "❌ Not quite — Bust");
        finishAndAdvance(moveCorrect, updatedScore, "Busted");
      } else {
        setMessage(
          moveCorrect
            ? "✅ Correct — Keep playing"
            : "❌ Not quite — Keep playing"
        );
      }
      return;
    }

    if (action === "Double") {
      if (!isFirstMove) {
        setExplanation(
          (e) => e + " (Note: Double is typically first-move only)"
        );
      }
      const nc = drawCard();
      const updatedHands = hands.map((h, i) => (i === active ? [...h, nc] : h));
      setHands(updatedHands);
      setMessage(
        moveCorrect ? "✅ Correct — Doubled" : "❌ Not quite — Doubled"
      );
      finishAndAdvance(moveCorrect, updatedScore, "Doubled");
      return;
    }

    if (action === "Split") {
      if (!isPair(currentHand)) return;
      const a = [currentHand[0], drawCard()];
      const b = [currentHand[1], drawCard()];
      setHands([a, b]);
      setHandScores((prev) => {
        const copy = [...prev];
        copy[active] = updatedScore;
        copy.splice(active + 1, 0, { c: 0, t: 0 });
        return copy;
      });
      setMessage(
        moveCorrect
          ? "✅ Correct — Split into two hands"
          : "❌ Not quite — Split into two hands"
      );
      setExplanation((e) => e + " • Play Hand A, then Hand B.");
      return;
    }

    if (action === "Stand") {
      setMessage(moveCorrect ? "✅ Correct — Stand" : "❌ Not quite — Stand");
      finishAndAdvance(moveCorrect, updatedScore, "Stood");
      return;
    }
  }

  // Compute EVs when opening the More Info panel
  useEffect(() => {
    if (!moreInfo?.visible || !lastDecision) return;
    const snap = history[history.length - 1];
    const handForSim = snap ? snap.hands[snap.active] : currentHand;
    const upForSim = snap ? snap.dealerUp : dealerUp;
    setEvStats(null);
    setTimeout(() => {
      const bestS = estimateEVStats(
        handForSim,
        upForSim,
        lastDecision.best,
        1200
      );
      const chosenS = estimateEVStats(
        handForSim,
        upForSim,
        lastDecision.chosen,
        1200
      );
      setEvStats({
        best: bestS,
        chosen: chosenS,
        delta: bestS.ev - chosenS.ev,
      });
    }, 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moreInfo?.visible]);

  if (!dealerUp || !best)
    return (
      <div className="ct-wrap">
        <div className="ct-container">Loading…</div>
      </div>
    );

  const ACTIONS = ["Hit", "Stand", "Double", "Split", "Surrender"];

  const settingsPopover = (
    <div className="settings-pop">
      <div className="settings-title">Settings</div>
      <div className="settings-row">
        <div className="small">Auto-advance after</div>
        <select
          className="select"
          value={autoAdvanceMs}
          onChange={(e) => setAutoAdvanceMs(parseInt(e.target.value, 10))}
        >
          <option value={0}>Off</option>
          <option value={2000}>2s</option>
          <option value={4000}>4s</option>
        </select>
      </div>
      <div className="settings-row">
        <div className="small">Hold on mistakes</div>
        <input
          type="checkbox"
          checked={holdOnMistakes}
          onChange={(e) => {
            setHoldOnMistakes(e.target.checked);
            localStorage.setItem("ct_hold_mistakes", String(e.target.checked));
          }}
        />
      </div>
      <div className="settings-row">
        <div className="small">Theme</div>
        <select
          className="select"
          value={theme}
          onChange={(e) => {
            setTheme(e.target.value);
            localStorage.setItem("ct_theme", e.target.value);
          }}
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>
    </div>
  );

  const showMoreInfo =
    lastDecision && !lastDecision.correct && moreInfo?.visible;
  const infoKey = decisionKeyFromCtx(lastDecision);
  const infoHint = EV_HINTS[infoKey];
  const extraTip = tipForContext(lastDecision);

  // Helper to get EV for a scenario
  const getEV = (category, total, dealerUp) => {
    let key = "";
    const dealerRank = dealerUp === 11 ? "A" : String(dealerUp);

    if (category === "HARD") {
      // For hard totals, construct a representative hand
      // Use 10 + (total-10) for totals >= 12, otherwise use smaller combos
      if (total >= 12) {
        const card2 = total - 10;
        const sorted = card2 <= 10 ? [String(card2), "10"].sort().join(',') : ["10", "10"].join(',');
        key = `${sorted}vs${dealerRank}`;
      } else {
        const card1 = Math.floor(total / 2);
        const card2 = total - card1;
        const sorted = [String(card1), String(card2)].sort().join(',');
        key = `${sorted}vs${dealerRank}`;
      }
    } else if (category === "SOFT") {
      // For soft totals, use A + (total - 11), sorted
      const otherCard = total - 11;
      const sorted = [String(otherCard), "A"].sort().join(',');
      key = `${sorted}vs${dealerRank}`;
    } else if (category === "PAIR") {
      // For pairs, use rank,rankvsDealerRank
      key = `${total},${total}vs${dealerRank}`;
    }

    const data = evLookup[key];
    if (!data || !data.evValues || !data.bestAction) return "—";
    const bestEV = data.evValues[data.bestAction]?.ev;
    return bestEV !== undefined ? bestEV.toFixed(3) : "—";
  };

  // Generate strategy tables
  const generateStrategyTables = () => {
    // Hard totals table (4-20 vs 2-11)
    const hardTotals = [];
    for (let total = 20; total >= 4; total--) {
      const row = { total };
      for (let up = 2; up <= 11; up++) {
        row[up] = hardStrategy(total, up);
      }
      hardTotals.push(row);
    }

    // Soft totals table (13-21 vs 2-11)
    const softTotals = [];
    for (let total = 21; total >= 13; total--) {
      const row = { total };
      for (let up = 2; up <= 11; up++) {
        row[up] = softStrategy(total, up);
      }
      softTotals.push(row);
    }

    // Pairs table (A,A through 2,2 vs 2-11)
    const pairs = [];
    const pairRanks = ["A", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
    for (const rank of pairRanks) {
      const row = { rank };
      for (let up = 2; up <= 11; up++) {
        row[up] = pairStrategy(rank, up);
      }
      pairs.push(row);
    }

    return { hardTotals, softTotals, pairs };
  };

  const strategySheet = showStrategySheet && (
    <div className="strategy-overlay" onClick={() => setShowStrategySheet(false)}>
      <div className="strategy-modal" onClick={(e) => e.stopPropagation()}>
        <div className="strategy-header">
          <h2>Basic Strategy Sheet (S17/DAS)</h2>
          <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
            <button
              className="btn"
              style={{padding:"6px 12px",fontSize:"12px",minHeight:"auto"}}
              onClick={() => setStrategyView(v => v === "action" ? "ev" : "action")}
            >
              {strategyView === "action" ? "Show EV" : "Show Action"}
            </button>
            <button className="strategy-close" onClick={() => setShowStrategySheet(false)}>×</button>
          </div>
        </div>
        <div className="strategy-content">
          {(() => {
            const { hardTotals, softTotals, pairs } = generateStrategyTables();
            return (
              <>
                {/* Hard Totals */}
                <div className="strategy-section">
                  <h3>Hard Totals</h3>
                  <table className="strategy-table">
                    <thead>
                      <tr>
                        <th>Your Hand</th>
                        {[2,3,4,5,6,7,8,9,10,"A"].map(up => <th key={up}>{up}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {hardTotals.map(row => (
                        <tr key={row.total}>
                          <th>{row.total}</th>
                          {[2,3,4,5,6,7,8,9,10,11].map(up => (
                            <td key={up} className={strategyView === "action" ? row[up].toLowerCase() : ""}>
                              {strategyView === "action" ? row[up][0] : getEV("HARD", row.total, up)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Soft Totals */}
                <div className="strategy-section">
                  <h3>Soft Totals (A + X)</h3>
                  <table className="strategy-table">
                    <thead>
                      <tr>
                        <th>Your Hand</th>
                        {[2,3,4,5,6,7,8,9,10,"A"].map(up => <th key={up}>{up}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {softTotals.map(row => (
                        <tr key={row.total}>
                          <th>A,{row.total - 11}</th>
                          {[2,3,4,5,6,7,8,9,10,11].map(up => (
                            <td key={up} className={strategyView === "action" ? row[up].toLowerCase() : ""}>
                              {strategyView === "action" ? row[up][0] : getEV("SOFT", row.total, up)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pairs */}
                <div className="strategy-section">
                  <h3>Pairs</h3>
                  <table className="strategy-table">
                    <thead>
                      <tr>
                        <th>Your Hand</th>
                        {[2,3,4,5,6,7,8,9,10,"A"].map(up => <th key={up}>{up}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {pairs.map(row => (
                        <tr key={row.rank}>
                          <th>{row.rank},{row.rank}</th>
                          {[2,3,4,5,6,7,8,9,10,11].map(up => (
                            <td key={up} className={strategyView === "action" ? row[up].toLowerCase() : ""}>
                              {strategyView === "action"
                                ? (row[up] === "Split" ? "P" : row[up][0])
                                : getEV("PAIR", row.rank, up)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Legend */}
                <div className="strategy-legend">
                  <div className="strategy-legend-item">
                    <div className="strategy-legend-box" style={{background:"linear-gradient(135deg,#fef3c7,#fde68a)"}}></div>
                    <span>H = Hit</span>
                  </div>
                  <div className="strategy-legend-item">
                    <div className="strategy-legend-box" style={{background:"linear-gradient(135deg,#d1fae5,#a7f3d0)"}}></div>
                    <span>S = Stand</span>
                  </div>
                  <div className="strategy-legend-item">
                    <div className="strategy-legend-box" style={{background:"linear-gradient(135deg,#dbeafe,#bfdbfe)"}}></div>
                    <span>D = Double</span>
                  </div>
                  <div className="strategy-legend-item">
                    <div className="strategy-legend-box" style={{background:"linear-gradient(135deg,#fce7f3,#fbcfe8)"}}></div>
                    <span>P = Split</span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`ct-wrap ${theme === "light" ? "light" : ""}`}>
      <style>{styles}</style>
      {strategySheet}
      <div className="ct-container">
        {/* Unified Stats Bar (sticky) */}
        <div className="stats-bar">
          <div className="stat-group">
            <Pill flash={flashStreak}>
              <Flame size={14} /> {streak}
            </Pill>
            <span className="stat-label">Streak</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-group">
            <span className="stat-value">{bestStreak}</span>
            <span className="stat-label">Best</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-group">
            <span className="stat-value">
              {totalAttempts ? Math.round((totalCorrect / totalAttempts) * 100) : 0}%
            </span>
            <span className="stat-label">Accuracy</span>
          </div>
        </div>

        <div className="header">
          <div className="brand">
            <Square size={22} /> Casino Trainer
          </div>
          <div className="stats" style={{ position: "relative" }}>
            <select
              className="select"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
            <button
              className="btn"
              onClick={() => setShowSettings((v) => !v)}
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
            {showSettings && settingsPopover}
          </div>
        </div>

        <div className="rules">
          <Info size={16} /> Blackjack · S17 · DAS · Strategy-only grading
        </div>

        <div className="table">
          <div className="grid">
            <div className="section">
              <h4>Dealer</h4>
              <div className="cardrow">
                <CardView card={dealerUp} />
                <CardView card={{ rank: "?", suit: "♠" }} hidden />
              </div>
            </div>
            <div className="section">
              <h4>You</h4>
              <div className="hands">
                {hands.map((h, idx) => (
                  <div
                    key={idx}
                    className={`hand ${idx === active ? "active" : ""}`}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <Badge>Hand {String.fromCharCode(65 + idx)}</Badge>
                      <span className="small">
                        {isSoft(h)
                          ? `Soft ${handTotals(h).soft}`
                          : `Hard ${handTotals(h).hard}`}
                      </span>
                    </div>
                    <div className="cardrow">
                      {h.map((c, i) => (
                        <CardView key={i} card={c} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="sep" />

          <div className="actions">
            {ACTIONS.map((act) => {
              const disabled =
                locked ||
                awaitingAdvance ||
                (act === "Split" && !isPair(hands[active] || [])) ||
                act === "Surrender";
              const shortcut = act === "Hit" ? "H" : act === "Stand" ? "S" : act === "Double" ? "D" : act === "Split" ? "P" : "";
              return (
                <button
                  key={act}
                  onClick={() => onChoose(act)}
                  className={`btn ${disabled ? "disabled" : ""}`}
                  disabled={disabled}
                >
                  {act}
                  {shortcut && <span className="kbd-hint">{shortcut}</span>}
                </button>
              );
            })}
          </div>

          <div className="feedback" style={{ flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontWeight: 800 }}>{message}</div>
            {explanation && <div className="small">{explanation}</div>}
          </div>

          {/* Inline feedback - shows automatically for wrong answers */}
          {showMoreInfo && (
            <div className="inline-feedback">
              <div className="inline-feedback-header">
                <strong>Why your move was wrong</strong>
                <button className="close-btn" onClick={() => setMoreInfo(null)}>×</button>
              </div>
              <div className="small" style={{ marginBottom: 8 }}>
                Best: <b>{lastDecision.best}</b> · You chose: <b>{lastDecision.chosen}</b>
                {lastDecision.first ? " (Opening)" : " (Later)"}
              </div>
              <div className="explanation-text">
                {infoHint
                  ? infoHint.blurb
                  : "This spot is decided by basic strategy for S17/DAS."}
              </div>
              {extraTip && <div className="tip-highlight">{extraTip}</div>}
              {evStats ? (
                <div className="ev-stats">
                  <div className="ev-row">
                    <span>EV:</span>
                    <span>Best {evStats.best.ev.toFixed(3)} vs Yours {evStats.chosen.ev.toFixed(3)}</span>
                    <span className="delta">ΔEV {evStats.delta.toFixed(3)}</span>
                  </div>
                  <div className="ev-row small">
                    Win/Push/Loss: Best {Math.round(evStats.best.wr * 100)}%/
                    {Math.round(evStats.best.pr * 100)}%/{Math.round(evStats.best.lr * 100)}%,
                    Yours {Math.round(evStats.chosen.wr * 100)}%/
                    {Math.round(evStats.chosen.pr * 100)}%/{Math.round(evStats.chosen.lr * 100)}%
                  </div>
                </div>
              ) : (
                <div className="small">Calculating EV…</div>
              )}
            </div>
          )}

          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 8,
            }}
          >
            <button
              onClick={() => (awaitingAdvance ? continueAdvance() : spawn())}
              className="btn primary"
              disabled={locked && !awaitingAdvance}
              style={{gridColumn: "1 / -1"}}
            >
              <Repeat size={16} />{" "}
              {awaitingAdvance ? "Continue" : "Next Scenario"}
              <span className="kbd-hint">{awaitingAdvance ? "Space" : "N"}</span>
            </button>
            <button
              onClick={() => setShowStrategySheet(true)}
              className="btn"
            >
              <BookOpen size={16} /> Strategy Sheet
            </button>
            <button
              onClick={() =>
                alert(`Quick tips:
• Identify Pair / Soft / Hard first.
• Always split A,A and 8,8.
• Hard 11: usually double (not vs Ace).
• Hard 12: stand vs 4–6, otherwise hit.
• Soft 18: double vs 3–6, stand vs 2/7/8, hit vs 9/10/A.
• Press ? to open Strategy Sheet`)
              }
              className="btn"
            >
              <HelpCircle size={16} /> Quick Tips
            </button>
            <button
              onClick={resetStats}
              className="btn"
              style={{gridColumn: "1 / -1"}}
            >
              <RotateCcw size={16} /> Reset Stats
            </button>
          </div>
        </div>

        <div className="footer">
          Casino Trainer · Blackjack (S17/DAS). Strategy-only grading; EV from
          Monte Carlo estimates (infinite shoe) for teaching. House rules may
          change results slightly.
        </div>
      </div>
    </div>
  );
}
