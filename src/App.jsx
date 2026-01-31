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
  AlertCircle,
  Zap,
  GraduationCap,
  ChevronDown,
} from "lucide-react";
import evLookup from "./data/evLookup.json";
import SpeedTrial from "./SpeedTrial";

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
:root{ --bg1:#F7F9FA; --bg2:#F7F9FA; --panel:#ffffff; --ink:#2F2F2F; --muted:#6B6F76; --brand:#4CC9B0; --brand-ink:#3BA896; --outline:#E3E7EA; --table:#ffffff; --shadow:0 20px 40px rgba(0,0,0,.06), 0 8px 16px rgba(0,0,0,.04); --error:#D64545; --warning:#F4C430; }
*{box-sizing:border-box}
html{height:100%;width:100%;-webkit-text-size-adjust:100%}
body{margin:0;padding:0;min-height:100%;width:100%;font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";overflow-x:hidden}
#root{min-height:100vh;min-height:-webkit-fill-available;width:100%;display:flex;flex-direction:column}
.ct-wrap{flex:1;display:flex;flex-direction:column;align-items:center;color:var(--ink);padding:20px;background:var(--bg1)}
.ct-wrap.light{--bg1:#F7F9FA; --bg2:#F7F9FA; --panel:#ffffff; --ink:#2F2F2F; --muted:#6B6F76; --table:#ffffff}
.ct-container{max-width:1600px;width:100%;margin:0 auto;background:#FFFFFF;border:1px solid var(--outline);border-radius:16px;box-shadow:var(--shadow);padding:0;position:relative;overflow:hidden;min-height:100%}
.product-header{display:flex;justify-content:space-between;align-items:center;padding:20px 24px 16px;border-bottom:1px solid var(--outline);flex-wrap:wrap;gap:12px}
.brand{display:flex;flex-direction:column;gap:2px;flex:1;min-width:200px}
.brand-title{font-weight:800;font-size:20px;color:var(--ink);line-height:1.2}
.brand-meta{font-size:13px;font-weight:500;color:var(--muted)}
.product-controls{display:flex;gap:8px;align-items:center;flex-shrink:0}
.main-content{padding:20px 24px 24px}
.mobile-action-dock{display:none}
.desktop-controls{display:block}
.pill{display:inline-flex;align-items:center;gap:5px;padding:5px 9px;border-radius:999px;background:rgba(76,201,176,0.1);border:1px solid rgba(76,201,176,0.3);color:var(--brand-ink);box-shadow:0 1px 3px rgba(0,0,0,.04)}
.rules{display:flex;align-items:center;gap:6px;color:var(--muted);font-size:12px;margin:6px 0 10px}
.table{background:linear-gradient(135deg,#f9fafb,#ffffff);border-radius:14px;padding:14px;border:1px solid var(--outline);box-shadow:inset 0 1px 2px rgba(0,0,0,.02)}
.grid{display:grid;grid-template-columns:200px 1fr;gap:14px;align-items:start}
.section h4{margin:0 0 6px 0;font-size:12px;color:var(--ink);font-weight:700}
.cardrow{display:flex;gap:8px;flex-wrap:wrap}
.card{width:64px;height:92px;border-radius:10px;background:#ffffff;border:1px solid var(--outline);box-shadow:0 2px 6px rgba(0,0,0,.04);display:flex;flex-direction:column;justify-content:space-between;align-items:center;padding:6px;transition:transform 0.2s ease}
.card:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(0,0,0,.1)}
.card.red{color:#b10e2a}
.card .rank{font-weight:800;font-size:13px}
.card .pip{font-size:24px}
.card .rank-btm{font-weight:800;font-size:13px;transform:rotate(180deg)}
.card.back{background:repeating-linear-gradient(45deg,#c0ced0,#c0ced0 7px,#b3c4c7 7px,#b3c4c7 14px);border-color:#a8babd}
.actions{display:flex;gap:8px;margin-top:10px;align-items:center}
.action-primary{flex:1;min-width:120px}
.action-secondary{flex:0.8;min-width:100px;opacity:0.9}
.btn{padding:9px 10px;border-radius:10px;border:1px solid var(--outline);background:#ffffff;font-weight:700;font-size:13px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.04);transition:all 0.15s cubic-bezier(0.4,0,0.2,1);display:inline-flex;align-items:center;gap:6px;color:var(--ink)}
.btn:hover{transform:translateY(-1px);box-shadow:0 3px 6px rgba(0,0,0,.08)}
.btn.primary{background:var(--brand);color:white;border-color:transparent;box-shadow:0 2px 6px rgba(76,201,176,0.25)}
.btn.primary:hover{transform:translateY(-1px);box-shadow:0 3px 8px rgba(76,201,176,0.35)}
.btn.disabled{background:#EFF2F4;color:#A0A6AD;cursor:not-allowed;opacity:1}
.kbd-hint{font-size:10px;opacity:0.5;margin-left:5px;font-weight:500}
.feedback{min-height:28px;display:flex;align-items:center;gap:8px;margin-top:10px}
.small{font-size:11px;color:var(--muted)}
.footer{margin-top:12px;color:var(--muted);font-size:11px}
.select{padding:5px 9px;border-radius:9px;border:1px solid var(--outline);background:#fff;color:var(--ink);font-weight:600;font-size:13px;font-family:inherit}
.stats{display:flex;gap:8px;align-items:center}
.stats-bar{background:#F7F9FA;border-bottom:1px solid var(--outline);padding:16px 24px;display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.stat-group{display:flex;flex-direction:column;align-items:center;gap:4px}
.stat-value{font-size:18px;font-weight:800;color:var(--ink)}
.stat-label{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.8px;font-weight:600}
.hands{display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap}
.hand{padding:8px;border:1px solid var(--outline);border-radius:12px;background:#fff}
.hand.active{outline:2px solid var(--brand);outline-offset:1px}
.badge{font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px;border:1px solid var(--outline);background:rgba(76,201,176,0.08);color:var(--ink);display:inline-flex;gap:5px;align-items:center}
.sep{height:1px;background:var(--outline);margin:10px 0}

/* Settings popover */
.settings-pop{position:absolute;top:52px;right:14px;background:#fff;border:1px solid var(--outline);border-radius:10px;box-shadow:var(--shadow);padding:10px 10px;min-width:260px;z-index:10}
.settings-row{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:5px 0}
.settings-title{font-weight:800;font-size:13px;margin-bottom:3px}
.learning-tools-menu{position:absolute;bottom:calc(100% + 8px);left:0;background:#fff;border:1px solid var(--outline);border-radius:10px;box-shadow:var(--shadow);min-width:240px;z-index:10;overflow:hidden}
.learning-tools-item{display:flex;align-items:center;gap:10px;padding:12px 14px;border:none;background:transparent;width:100%;text-align:left;cursor:pointer;font-size:14px;font-weight:600;color:var(--ink);transition:background 0.15s}
.learning-tools-item:hover{background:rgba(76,201,176,0.08)}
.learning-tools-item:not(:last-child){border-bottom:1px solid var(--outline)}

/* Strategy Sheet Modal */
.strategy-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px}
.strategy-modal{background:#fff;border-radius:16px;box-shadow:var(--shadow);max-width:1100px;width:100%;max-height:90vh;overflow-y:auto;position:relative}
.strategy-header{position:sticky;top:0;background:var(--brand);color:white;padding:16px 20px;border-radius:16px 16px 0 0;display:flex;justify-content:space-between;align-items:center;z-index:10}
.strategy-header h2{margin:0;font-size:20px;font-weight:800}
.strategy-close{background:rgba(255,255,255,0.2);border:none;color:white;font-size:24px;cursor:pointer;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;transition:background 0.2s}
.strategy-close:hover{background:rgba(255,255,255,0.3)}
.strategy-content{padding:20px}
.strategy-section{margin-bottom:24px}
.strategy-section:last-child{margin-bottom:0}
.strategy-section h3{margin:0 0 12px 0;font-size:16px;font-weight:700;color:var(--ink)}
.strategy-table{width:100%;border-collapse:collapse;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08)}
.strategy-table th,.strategy-table td{padding:8px 6px;text-align:center;border:1px solid var(--outline);font-weight:600}
.strategy-table thead th{background:#ffffff;color:var(--ink);font-weight:800;position:sticky;top:68px;z-index:5;border-bottom:2px solid var(--outline)}
.strategy-table tbody th{background:#F7F9FA;color:var(--ink);font-weight:800}
.strategy-table td.hit{background:rgba(254,243,199,0.4);color:#92400E;font-weight:600}
.strategy-table td.stand{background:rgba(76,201,176,0.18);color:var(--brand-ink);font-weight:600}
.strategy-table td.double{background:rgba(147,197,253,0.25);color:#1E40AF;font-weight:600}
.strategy-table td.split{background:rgba(251,207,232,0.35);color:#BE185D;font-weight:700}
.strategy-legend{display:flex;gap:12px;flex-wrap:wrap;margin-top:16px;padding:12px;background:#f9fafb;border-radius:8px}
.strategy-legend-item{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600}
.strategy-legend-box{width:20px;height:20px;border-radius:4px;border:1px solid rgba(0,0,0,0.1)}

/* Speed Trial styles */
.speed-trial-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px}
.speed-trial-modal{background:#fff;border-radius:16px;box-shadow:var(--shadow);max-width:900px;width:100%;max-height:90vh;overflow-y:auto;border-top:3px solid var(--warning)}
.speed-trial-header{background:#ffffff;color:var(--ink);padding:16px 20px;border-bottom:1px solid var(--outline);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:1}
.speed-trial-header h2{margin:0;font-size:20px;font-weight:800}
.speed-trial-content{position:relative}
.speed-trial-modes{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:24px}
.speed-trial-mode{border:1px solid var(--outline);border-radius:12px;padding:16px;background:#fff;transition:all 0.2s}
.speed-trial-mode:hover{border-color:var(--brand);box-shadow:0 3px 8px rgba(76,201,176,0.15)}
.mode-header{display:flex;align-items:center;gap:8px;margin-bottom:8px;color:var(--warning)}
.mode-header h3{margin:0;font-size:16px;font-weight:800}
.mode-desc{margin:4px 0;font-size:13px;color:var(--ink)}
.mode-target{margin:4px 0 12px;font-size:11px;color:var(--muted)}
.speed-trial-scoring{background:#f9fafb;border-radius:8px;padding:12px 16px;border:1px solid var(--outline)}
.speed-trial-scoring h4{margin:0 0 8px 0;font-size:13px;font-weight:800}
.speed-trial-scoring ul{margin:0;padding-left:20px;font-size:12px;line-height:1.7}
.speed-trial-progress{background:rgba(244,196,48,0.15);padding:4px 12px;border-radius:999px;font-weight:700;font-size:13px;color:var(--ink)}
.speed-trial-timer{display:flex;align-items:center;gap:6px;background:rgba(244,196,48,0.15);padding:6px 12px;border-radius:999px;font-weight:700;font-size:14px;color:var(--ink)}
.speed-trial-score{background:rgba(76,201,176,0.15);padding:6px 12px;border-radius:999px;font-weight:700;font-size:14px;color:var(--ink)}
.speed-trial-results{background:#f9fafb;border-radius:12px;padding:20px;border:1px solid var(--outline)}
.results-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px}
.result-stat{text-align:center;padding:16px;background:#fff;border-radius:10px;border:1px solid var(--outline)}
.result-value{font-size:32px;font-weight:800;color:var(--brand);margin-bottom:4px}
.result-label{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px}
.results-details h4{margin:0 0 12px 0;font-size:14px;font-weight:800}
.results-list{max-height:400px;overflow-y:auto;background:#fff;border-radius:8px;padding:8px;border:1px solid var(--outline)}
.result-item{display:grid;grid-template-columns:24px 1fr auto 60px 60px;gap:8px;align-items:center;padding:8px;border-radius:6px;margin-bottom:4px;font-size:12px;transition:background 0.2s}
.result-item:hover{background:#f9fafb}
.result-item.correct{border-left:3px solid var(--brand)}
.result-item.incorrect{border-left:3px solid var(--error)}
.result-icon{display:flex;align-items:center}
.result-item.correct .result-icon{color:var(--brand)}
.result-item.incorrect .result-icon{color:var(--error)}
.result-hand{font-weight:600}
.result-decision{color:var(--muted);font-size:11px}
.result-time{text-align:right;font-weight:600}
.result-points{text-align:right;font-weight:800;padding:4px 8px;border-radius:4px}
.result-points.positive{color:var(--brand-ink);background:rgba(76,201,176,0.12)}
.result-points.negative{color:var(--error);background:rgba(214,69,69,0.1)}

/* Inline feedback (replaces modal) */
.inline-feedback{margin-top:12px;background:#ffffff;border-left:3px solid var(--error);border-radius:8px;padding:12px 14px;box-shadow:0 2px 6px rgba(0,0,0,.06);border:1px solid var(--outline);overflow:hidden}
.inline-feedback-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-weight:700;font-size:13px;color:var(--ink)}
.close-btn{background:none;border:none;font-size:20px;cursor:pointer;opacity:0.5;line-height:1;padding:0;width:20px;height:20px;color:var(--muted)}
.close-btn:hover{opacity:1}
.explanation-text{margin:6px 0;font-size:12px;line-height:1.6;color:var(--ink)}
.tip-highlight{background:rgba(244,196,48,0.1);border-left:2px solid var(--warning);padding:8px 10px;margin:8px 0;border-radius:6px;font-weight:600;font-size:12px;color:var(--ink)}
.ev-stats{background:#F7F9FA;border-radius:6px;padding:8px 10px;margin-top:8px;font-size:11px}
.ev-row{display:flex;justify-content:space-between;gap:8px;margin:4px 0}
.delta{font-weight:700;color:var(--error)}

/* Mobile responsive breakpoints */
@media (max-width: 768px) {
  .ct-wrap{padding:10px}
  .ct-container{padding:10px;border-radius:16px;max-width:100%}
  .strategy-overlay{padding:10px}
  .strategy-modal{max-height:95vh}
  .strategy-header{padding:12px 16px}
  .speed-trial-overlay{padding:10px}
  .speed-trial-modal{max-height:95vh}
  .speed-trial-header{padding:12px 16px;font-size:16px}
  .speed-trial-modes{grid-template-columns:1fr;gap:12px}
  .speed-trial-mode{padding:12px}
  .mode-header h3{font-size:14px}
  .mode-desc{font-size:12px}
  .speed-trial-timer{font-size:12px;padding:4px 10px}
  .speed-trial-score{font-size:12px;padding:4px 10px}
  .speed-trial-progress{font-size:12px;padding:3px 10px}
  .results-summary{grid-template-columns:1fr;gap:12px}
  .result-value{font-size:24px}
  .result-item{grid-template-columns:20px 1fr auto 50px 50px;font-size:11px;padding:6px}
  .results-list{max-height:300px}
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
  .actions{flex-wrap:wrap;gap:6px;margin-top:8px}
  .action-primary{min-width:100px}
  .action-secondary{min-width:90px}
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
  /* Base mobile setup */
  html{height:100%;height:100dvh;height:-webkit-fill-available;width:100%;overflow-x:hidden}
  body{height:100%;height:100dvh;height:-webkit-fill-available;overflow:hidden;width:100%}
  #root{height:100%;height:100dvh;height:-webkit-fill-available;overflow:hidden;width:100%}
  .ct-wrap{padding:0!important;height:100%;height:100dvh;height:-webkit-fill-available;overflow-y:auto;overflow-x:hidden;width:100%;box-sizing:border-box;padding-bottom:180px!important}
  .ct-container{padding:0!important;width:100%!important;max-width:none!important;margin:0!important;border-radius:0!important;overflow-x:hidden;min-height:100%;box-sizing:border-box;padding-bottom:180px!important}

  /* Compressed header */
  .product-header{padding:8px 12px;gap:8px;border-bottom:1px solid var(--outline)}
  .brand{flex:1 1 100%;min-width:100%}
  .brand-title{font-size:16px;line-height:1.2}
  .brand-meta{font-size:11px;line-height:1.3;margin-top:2px}
  .product-controls{flex:1 1 100%;justify-content:flex-end;width:100%;gap:6px}
  .select{padding:5px 8px;font-size:12px;min-width:85px;font-weight:600}
  .btn{padding:6px 8px;font-size:11px;min-height:32px}

  /* Compact stats row with centered alignment */
  .stats-bar{margin:0;padding:8px 12px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;border-bottom:1px solid var(--outline)}
  .stat-group{padding:6px 0;display:flex;flex-direction:column;align-items:center;gap:4px}
  .stat-value{font-size:18px;font-weight:800}
  .stat-label{font-size:9px;letter-spacing:0.5px;font-weight:600}
  .pill{padding:4px 7px;gap:4px;font-size:15px;font-weight:800}
  .pill svg{width:12px;height:12px}

  /* Main content with bottom padding for sticky dock */
  .main-content{padding:12px;padding-bottom:20px}

  /* Vertical stack gameplay */
  .table{padding:0;background:transparent;border:none;box-shadow:none}
  .grid{display:flex;flex-direction:column;gap:16px;align-items:center}
  .section{width:100%;display:flex;flex-direction:column;align-items:center}
  .section h4{font-size:11px;text-align:center;margin-bottom:8px;font-weight:700;color:var(--muted)}

  /* Cards optimized for iPhone (including Pro Max) */
  /* Reduced from 18vw to 16vw and max from 84px to 76px for better fit */
  .card{width:clamp(68px, 16vw, 76px);height:clamp(97.75px, 23vw, 109.25px);flex-shrink:0;padding:6px;border-radius:10px}
  .card .rank{font-size:clamp(11px, 2.6vw, 13px);font-weight:800}
  .card .pip{font-size:clamp(20px, 4.8vw, 24px);line-height:1}
  .card .rank-btm{font-size:clamp(11px, 2.6vw, 13px);font-weight:800}
  .cardrow{gap:8px;justify-content:center;flex-shrink:0;flex-wrap:nowrap}

  /* Hands layout */
  .hands{justify-content:center;gap:8px}
  .hand{padding:8px;border-radius:10px}
  .badge{font-size:9px;padding:2px 6px}

  /* Hide desktop action buttons (will use sticky dock) */
  .actions{display:none!important}

  /* Show mobile dock */
  .mobile-action-dock{display:block!important;position:fixed;bottom:0;left:0;right:0;background:rgba(255,255,255,0.98);backdrop-filter:blur(10px);border-top:2px solid var(--outline);padding:12px;padding-bottom:calc(12px + env(safe-area-inset-bottom));box-shadow:0 -4px 12px rgba(0,0,0,0.1);z-index:20}
  .mobile-actions-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:0}
  .mobile-action-btn{min-height:52px;font-size:14px;font-weight:700;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:6px}
  .mobile-secondary-row{display:flex;gap:8px;margin-top:8px}
  .mobile-secondary-btn{flex:1;min-height:44px;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:4px}

  /* Learning tools menu positioning for mobile */
  .learning-tools-menu{bottom:auto;left:auto;right:12px;top:auto;transform:translateY(-100%);margin-bottom:8px}

  /* Feedback area */
  .feedback{margin-top:12px;padding:0 12px}

  /* Strategy modals */
  .strategy-overlay{padding:6px}
  .strategy-header{padding:10px 12px}
  .strategy-header h2{font-size:14px}
  .strategy-content{padding:12px}
  .strategy-section{margin-bottom:16px}
  .strategy-section h3{font-size:13px}
  .strategy-table{font-size:9px}
  .strategy-table th,.strategy-table td{padding:5px 3px}

  /* Hide desktop-only controls */
  .desktop-controls{display:none!important}
}

@media (max-width: 480px) {
  html{height:100%;height:100dvh;height:-webkit-fill-available;width:100%;overflow-x:hidden}
  body{height:100%;height:100dvh;height:-webkit-fill-available;overflow:hidden;width:100%}
  #root{height:100%;height:100dvh;height:-webkit-fill-available;overflow:hidden;width:100%}
  .ct-wrap{padding:0!important;height:100%;height:100dvh;height:-webkit-fill-available;overflow-y:auto;overflow-x:hidden;width:100%;box-sizing:border-box}
  .ct-container{padding:6px!important;border-radius:0!important;width:100%!important;max-width:none!important;margin:0!important;min-height:100%;box-sizing:border-box}
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
  const [showLearningTools, setShowLearningTools] = useState(false);
  const [history, setHistory] = useState([]);
  const [flashStreak, setFlashStreak] = useState(false);
  const [moreInfo, setMoreInfo] = useState(null);
  const [lastDecision, setLastDecision] = useState(null);
  const [evStats, setEvStats] = useState(null);
  const [evLoading, setEvLoading] = useState(false);
  const [showStrategySheet, setShowStrategySheet] = useState(false);
  const [strategyView, setStrategyView] = useState("action"); // "action" or "ev"
  const [mistakes, setMistakes] = useState(() => {
    try {
      const stored = localStorage.getItem("bj_mistakes");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [showMistakes, setShowMistakes] = useState(false);
  const [showQuickTips, setShowQuickTips] = useState(false);
  const [showSpeedTrial, setShowSpeedTrial] = useState(false);

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

  function trackMistake(mistakeData) {
    setMistakes((prev) => {
      const newMistakes = [mistakeData, ...prev].slice(0, 20); // Keep last 20
      localStorage.setItem("bj_mistakes", JSON.stringify(newMistakes));
      return newMistakes;
    });
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
        setShowLearningTools(false);
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

  // Close learning tools menu on click outside
  useEffect(() => {
    if (!showLearningTools) return;

    const handleClickOutside = (e) => {
      // Close if clicking outside the menu and button
      if (!e.target.closest('.learning-tools-menu') && !e.target.closest('.btn')) {
        setShowLearningTools(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showLearningTools]);

  function continueAdvance() {
    // Clear feedback and reset state when advancing to next hand
    setMoreInfo(null);
    setMessage("");
    setAwaitingAdvance(false);
    setLocked(false);

    if (active < hands.length - 1) {
      setActive((prev) => prev + 1);
    } else {
      spawn();
    }
  }

  function finishAndAdvance(lastMoveCorrect, finalScore, reason) {
    setLocked(true);
    const suffix = reason ? ` — ${reason}` : "";
    setMessage(
      `${lastMoveCorrect ? "✅ Correct" : "❌ Incorrect"} · Hand finished — ${
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

      // Track mistake
      trackMistake({
        timestamp: Date.now(),
        category: ctx.category,
        playerHand: [...currentHand],
        playerTotal: ctx.category === "PAIR" ? null : (ctx.category === "SOFT" ? ctx.total : ctx.total),
        dealerUpcard: { ...dealerUp },
        chosenAction: action,
        correctAction: best.action,
        difficulty: mode,
      });
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
        setMessage(moveCorrect ? "✅ Correct — Bust" : "❌ Incorrect — Bust");
        finishAndAdvance(moveCorrect, updatedScore, "Busted");
      } else {
        setMessage(
          moveCorrect
            ? "✅ Correct — Keep playing"
            : "❌ Incorrect — Keep playing"
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
        moveCorrect ? "✅ Correct — Doubled" : "❌ Incorrect — Doubled"
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
          : "❌ Incorrect — Split into two hands"
      );
      setExplanation((e) => e + " • Play Hand A, then Hand B.");
      return;
    }

    if (action === "Stand") {
      setMessage(moveCorrect ? "✅ Correct — Stand" : "❌ Incorrect — Stand");
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
      <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--outline)" }}>
        <button
          onClick={() => {
            resetStats();
            setShowSettings(false);
          }}
          className="btn"
          style={{
            width: "100%",
            justifyContent: "center",
            background: "rgba(214, 69, 69, 0.1)",
            color: "var(--error)",
            borderColor: "var(--error)"
          }}
        >
          <RotateCcw size={16} /> Reset Stats
        </button>
      </div>
    </div>
  );

  const learningToolsMenu = (
    <div className="learning-tools-menu">
      <button
        className="learning-tools-item"
        onClick={() => {
          setShowStrategySheet(true);
          setShowLearningTools(false);
        }}
      >
        <BookOpen size={18} />
        <span>Strategy Sheet</span>
      </button>
      <button
        className="learning-tools-item"
        onClick={() => {
          setShowQuickTips(true);
          setShowLearningTools(false);
        }}
      >
        <HelpCircle size={18} />
        <span>Quick Tips</span>
      </button>
      <button
        className="learning-tools-item"
        onClick={() => {
          setShowMistakes(true);
          setShowLearningTools(false);
        }}
      >
        <AlertCircle size={18} />
        <span>Review Mistakes {mistakes.length > 0 && `(${mistakes.length})`}</span>
      </button>
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

  // Get EV-based background color intensity
  const getEVColor = (category, total, dealerUp, action) => {
    const evStr = getEV(category, total, dealerUp);
    if (evStr === "—") return {};
    const ev = parseFloat(evStr);

    // Positive EV: teal with intensity
    if (ev > 0.05) {
      const intensity = Math.min(ev * 2, 0.3); // Cap at 0.3 opacity
      return { backgroundColor: `rgba(76, 201, 176, ${intensity})`, color: 'var(--brand-ink)' };
    }
    // Negative EV: red with intensity based on how bad it is
    else if (ev < -0.3) {
      const intensity = Math.min(Math.abs(ev) * 0.3, 0.2); // Cap at 0.2 opacity
      return { backgroundColor: `rgba(214, 69, 69, ${intensity})`, color: 'var(--error)' };
    }
    // Near neutral: keep existing action-based coloring
    return {};
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
                            <td
                              key={up}
                              className={strategyView === "action" ? row[up].toLowerCase() : ""}
                              style={strategyView === "ev" ? getEVColor("HARD", row.total, up, row[up]) : {}}
                            >
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
                            <td
                              key={up}
                              className={strategyView === "action" ? row[up].toLowerCase() : ""}
                              style={strategyView === "ev" ? getEVColor("SOFT", row.total, up, row[up]) : {}}
                            >
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
                            <td
                              key={up}
                              className={strategyView === "action" ? row[up].toLowerCase() : ""}
                              style={strategyView === "ev" ? getEVColor("PAIR", row.rank, up, row[up]) : {}}
                            >
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
                    <div className="strategy-legend-box" style={{background:"rgba(254,243,199,0.4)", border:"1px solid rgba(146,64,14,0.2)"}}></div>
                    <span>H = Hit</span>
                  </div>
                  <div className="strategy-legend-item">
                    <div className="strategy-legend-box" style={{background:"rgba(76,201,176,0.18)", border:"1px solid rgba(76,201,176,0.4)"}}></div>
                    <span>S = Stand</span>
                  </div>
                  <div className="strategy-legend-item">
                    <div className="strategy-legend-box" style={{background:"rgba(147,197,253,0.25)", border:"1px solid rgba(30,64,175,0.3)"}}></div>
                    <span>D = Double</span>
                  </div>
                  <div className="strategy-legend-item">
                    <div className="strategy-legend-box" style={{background:"rgba(251,207,232,0.35)", border:"1px solid rgba(190,24,93,0.3)"}}></div>
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

  const mistakesModal = showMistakes && (
    <div className="strategy-overlay" onClick={() => setShowMistakes(false)}>
      <div className="strategy-modal" onClick={(e) => e.stopPropagation()}>
        <div className="strategy-header">
          <h2>Review Mistakes ({mistakes.length})</h2>
          <button className="strategy-close" onClick={() => setShowMistakes(false)}>×</button>
        </div>
        <div className="strategy-content">
          {mistakes.length === 0 ? (
            <div style={{padding:"40px",textAlign:"center",color:"#6b7280"}}>
              <AlertCircle size={48} style={{margin:"0 auto 16px",opacity:0.5}} />
              <p style={{fontSize:"16px",fontWeight:"600"}}>No mistakes yet!</p>
              <p style={{fontSize:"14px"}}>Keep practicing. Mistakes will appear here to help you learn.</p>
            </div>
          ) : (
            <>
              {/* Pattern Analysis */}
              <div style={{marginBottom:"24px",padding:"16px",background:"#f9fafb",borderRadius:"12px"}}>
                <h3 style={{margin:"0 0 12px",fontSize:"14px",fontWeight:"700"}}>Patterns</h3>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))",gap:"12px"}}>
                  {(() => {
                    const byCategory = mistakes.reduce((acc, m) => {
                      acc[m.category] = (acc[m.category] || 0) + 1;
                      return acc;
                    }, {});
                    return Object.entries(byCategory).map(([cat, count]) => (
                      <div key={cat} style={{padding:"8px",background:"white",borderRadius:"8px",textAlign:"center"}}>
                        <div style={{fontSize:"20px",fontWeight:"800",color:"#ef4444"}}>{count}</div>
                        <div style={{fontSize:"11px",color:"#6b7280",textTransform:"uppercase"}}>{cat}</div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Mistakes List */}
              <h3 style={{margin:"0 0 12px",fontSize:"14px",fontWeight:"700"}}>Recent Mistakes</h3>
              <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                {mistakes.map((mistake, idx) => (
                  <div key={idx} style={{padding:"12px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"10px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:"8px"}}>
                      <div>
                        <div style={{fontSize:"12px",fontWeight:"700",color:"#991b1b"}}>
                          {mistake.category === 'HARD' ? 'Hard Total' : mistake.category === 'SOFT' ? 'Soft Total' : 'Pair'} ({mistake.difficulty} mode)
                        </div>
                        <div style={{fontSize:"11px",color:"#6b7280"}}>
                          {new Date(mistake.timestamp).toLocaleDateString()} {new Date(mistake.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap"}}>
                      <div>
                        <div style={{fontSize:"10px",color:"#6b7280",marginBottom:"4px"}}>Your Hand</div>
                        <div style={{display:"flex",gap:"4px"}}>
                          {mistake.playerHand.map((card, i) => (
                            <div key={i} style={{fontSize:"11px",padding:"4px 8px",background:"white",border:"1px solid #e5e7eb",borderRadius:"6px",fontWeight:"600"}}>
                              {card.rank}
                              <span style={{color:card.suit==="♥"||card.suit==="♦"?"#dc2626":"#000"}}>{card.suit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{fontSize:"14px",color:"#6b7280"}}>vs</div>
                      <div>
                        <div style={{fontSize:"10px",color:"#6b7280",marginBottom:"4px"}}>Dealer</div>
                        <div style={{fontSize:"11px",padding:"4px 8px",background:"white",border:"1px solid #e5e7eb",borderRadius:"6px",fontWeight:"600"}}>
                          {mistake.dealerUpcard.rank}
                          <span style={{color:mistake.dealerUpcard.suit==="♥"||mistake.dealerUpcard.suit==="♦"?"#dc2626":"#000"}}>{mistake.dealerUpcard.suit}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{marginTop:"8px",display:"flex",gap:"8px",alignItems:"center",fontSize:"12px"}}>
                      <span style={{color:"#6b7280"}}>You chose:</span>
                      <span style={{padding:"2px 8px",background:"#fee2e2",border:"1px solid #fecaca",borderRadius:"6px",fontWeight:"700",color:"#991b1b"}}>{mistake.chosenAction}</span>
                      <span style={{color:"#6b7280"}}>Correct:</span>
                      <span style={{padding:"2px 8px",background:"#d1fae5",border:"1px solid #a7f3d0",borderRadius:"6px",fontWeight:"700",color:"#065f46"}}>{mistake.correctAction}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const quickTipsModal = showQuickTips && (
    <div className="strategy-overlay" onClick={() => setShowQuickTips(false)}>
      <div className="strategy-modal" onClick={(e) => e.stopPropagation()}>
        <div className="strategy-header">
          <h2>Quick Tips</h2>
          <button className="strategy-close" onClick={() => setShowQuickTips(false)}>×</button>
        </div>
        <div className="strategy-content">
          {/* Keyboard Shortcuts */}
          <div style={{marginBottom:"24px"}}>
            <h3 style={{margin:"0 0 12px",fontSize:"14px",fontWeight:"700",color:"#10b981"}}>⌨️ Keyboard Shortcuts</h3>
            <div style={{display:"grid",gap:"10px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px",background:"#f9fafb",borderRadius:"8px"}}>
                <kbd style={{padding:"4px 8px",background:"white",border:"1px solid #e5e7eb",borderRadius:"6px",fontWeight:"700",fontSize:"12px",minWidth:"32px",textAlign:"center"}}>H</kbd>
                <span style={{fontSize:"13px",color:"#374151"}}>Hit - Take another card</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px",background:"#f9fafb",borderRadius:"8px"}}>
                <kbd style={{padding:"4px 8px",background:"white",border:"1px solid #e5e7eb",borderRadius:"6px",fontWeight:"700",fontSize:"12px",minWidth:"32px",textAlign:"center"}}>S</kbd>
                <span style={{fontSize:"13px",color:"#374151"}}>Stand - Keep your current hand</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px",background:"#f9fafb",borderRadius:"8px"}}>
                <kbd style={{padding:"4px 8px",background:"white",border:"1px solid #e5e7eb",borderRadius:"6px",fontWeight:"700",fontSize:"12px",minWidth:"32px",textAlign:"center"}}>D</kbd>
                <span style={{fontSize:"13px",color:"#374151"}}>Double - Double your bet and take one card</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px",background:"#f9fafb",borderRadius:"8px"}}>
                <kbd style={{padding:"4px 8px",background:"white",border:"1px solid #e5e7eb",borderRadius:"6px",fontWeight:"700",fontSize:"12px",minWidth:"32px",textAlign:"center"}}>P</kbd>
                <span style={{fontSize:"13px",color:"#374151"}}>Split - Split pairs into two hands</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px",background:"#f9fafb",borderRadius:"8px"}}>
                <kbd style={{padding:"4px 8px",background:"white",border:"1px solid #e5e7eb",borderRadius:"6px",fontWeight:"700",fontSize:"12px",minWidth:"32px",textAlign:"center"}}>Space</kbd>
                <span style={{fontSize:"13px",color:"#374151"}}>Continue to next hand</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px",background:"#f9fafb",borderRadius:"8px"}}>
                <kbd style={{padding:"4px 8px",background:"white",border:"1px solid #e5e7eb",borderRadius:"6px",fontWeight:"700",fontSize:"12px",minWidth:"32px",textAlign:"center"}}>N</kbd>
                <span style={{fontSize:"13px",color:"#374151"}}>New scenario</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px",background:"#f9fafb",borderRadius:"8px"}}>
                <kbd style={{padding:"4px 8px",background:"white",border:"1px solid #e5e7eb",borderRadius:"6px",fontWeight:"700",fontSize:"12px",minWidth:"32px",textAlign:"center"}}>U</kbd>
                <span style={{fontSize:"13px",color:"#374151"}}>Undo last action</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px",background:"#f9fafb",borderRadius:"8px"}}>
                <kbd style={{padding:"4px 8px",background:"white",border:"1px solid #e5e7eb",borderRadius:"6px",fontWeight:"700",fontSize:"12px",minWidth:"32px",textAlign:"center"}}>Esc</kbd>
                <span style={{fontSize:"13px",color:"#374151"}}>Close modals</span>
              </div>
            </div>
          </div>

          {/* Strategy Tips */}
          <div style={{marginBottom:"24px"}}>
            <h3 style={{margin:"0 0 12px",fontSize:"14px",fontWeight:"700",color:"#3b82f6"}}>🎯 Strategy Tips</h3>
            <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              <div style={{padding:"12px",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:"10px"}}>
                <div style={{fontSize:"13px",fontWeight:"600",color:"#1e40af",marginBottom:"4px"}}>Soft vs Hard Totals</div>
                <div style={{fontSize:"12px",color:"#1e3a8a",lineHeight:"1.5"}}>
                  A soft hand contains an Ace counted as 11 (e.g., A+6=soft 17). Hard hands either have no Ace or the Ace counts as 1. Soft hands are more flexible!
                </div>
              </div>
              <div style={{padding:"12px",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:"10px"}}>
                <div style={{fontSize:"13px",fontWeight:"600",color:"#1e40af",marginBottom:"4px"}}>Dealer Bust Cards</div>
                <div style={{fontSize:"12px",color:"#1e3a8a",lineHeight:"1.5"}}>
                  When dealer shows 2-6, they're more likely to bust. Stand more often with weaker hands. When dealer shows 7-A, they have a strong hand - hit more aggressively.
                </div>
              </div>
              <div style={{padding:"12px",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:"10px"}}>
                <div style={{fontSize:"13px",fontWeight:"600",color:"#1e40af",marginBottom:"4px"}}>Doubling Down</div>
                <div style={{fontSize:"12px",color:"#1e3a8a",lineHeight:"1.5"}}>
                  Double down when you have a strong advantage: hard 11 against any dealer card, hard 10 against 2-9, and soft hands against weak dealer cards (2-6).
                </div>
              </div>
              <div style={{padding:"12px",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:"10px"}}>
                <div style={{fontSize:"13px",fontWeight:"600",color:"#1e40af",marginBottom:"4px"}}>Splitting Pairs</div>
                <div style={{fontSize:"12px",color:"#1e3a8a",lineHeight:"1.5"}}>
                  Always split Aces and 8s. Never split 5s or 10s. Other pairs depend on the dealer's upcard - check the Strategy Sheet for specifics!
                </div>
              </div>
            </div>
          </div>

          {/* Learning Tips */}
          <div>
            <h3 style={{margin:"0 0 12px",fontSize:"14px",fontWeight:"700",color:"#8b5cf6"}}>📚 Learning Tips</h3>
            <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              <div style={{padding:"12px",background:"#f5f3ff",border:"1px solid #ddd6fe",borderRadius:"10px"}}>
                <div style={{fontSize:"13px",fontWeight:"600",color:"#6d28d9",marginBottom:"4px"}}>Start with Easy Mode</div>
                <div style={{fontSize:"12px",color:"#5b21b6",lineHeight:"1.5"}}>
                  Master the fundamentals in Easy mode before moving to Medium and Hard. Build your streak and confidence first!
                </div>
              </div>
              <div style={{padding:"12px",background:"#f5f3ff",border:"1px solid #ddd6fe",borderRadius:"10px"}}>
                <div style={{fontSize:"13px",fontWeight:"600",color:"#6d28d9",marginBottom:"4px"}}>Review Your Mistakes</div>
                <div style={{fontSize:"12px",color:"#5b21b6",lineHeight:"1.5"}}>
                  Click "Review Mistakes" to see patterns in your errors. Focus on the hand types you struggle with most.
                </div>
              </div>
              <div style={{padding:"12px",background:"#f5f3ff",border:"1px solid #ddd6fe",borderRadius:"10px"}}>
                <div style={{fontSize:"13px",fontWeight:"600",color:"#6d28d9",marginBottom:"4px"}}>Use the Strategy Sheet</div>
                <div style={{fontSize:"12px",color:"#5b21b6",lineHeight:"1.5"}}>
                  Reference the Strategy Sheet to memorize optimal plays. Over time, these decisions will become automatic.
                </div>
              </div>
              <div style={{padding:"12px",background:"#f5f3ff",border:"1px solid #ddd6fe",borderRadius:"10px"}}>
                <div style={{fontSize:"13px",fontWeight:"600",color:"#6d28d9",marginBottom:"4px"}}>Practice Daily</div>
                <div style={{fontSize:"12px",color:"#5b21b6",lineHeight:"1.5"}}>
                  Even 5-10 minutes of daily practice will dramatically improve your skills. Consistency beats intensity!
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`ct-wrap ${theme === "light" ? "light" : ""}`}>
      <style>{styles}</style>
      {strategySheet}
      {mistakesModal}
      {quickTipsModal}
      {showSpeedTrial && (
        <SpeedTrial
          generateScenario={generateScenario}
          bestAction={bestAction}
          onClose={() => setShowSpeedTrial(false)}
        />
      )}
      <div className="ct-container">
        {/* Tier 1: Product Header */}
        <div className="product-header">
          <div className="brand">
            <div className="brand-title">Casino Trainer</div>
            <div className="brand-meta">Blackjack · S17 · DAS · Strategy-only grading</div>
          </div>
          <div className="product-controls">
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

        {/* Tier 2: Session Stats Bar */}
        <div className="stats-bar">
          <div className="stat-group">
            <Pill flash={flashStreak}>
              <Flame size={14} /> {streak}
            </Pill>
            <span className="stat-label">Streak</span>
          </div>
          <div className="stat-group">
            <span className="stat-value">{bestStreak}</span>
            <span className="stat-label">Best</span>
          </div>
          <div className="stat-group">
            <span className="stat-value">
              {totalAttempts ? Math.round((totalCorrect / totalAttempts) * 100) : 0}%
            </span>
            <span className="stat-label">Accuracy</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
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

          {/* Desktop Actions */}
          <div className="actions desktop-controls">
            {ACTIONS.map((act) => {
              // Hide invalid actions instead of showing disabled
              if (act === "Surrender") return null;
              if (act === "Split" && !isPair(hands[active] || [])) return null;

              const disabled = locked || awaitingAdvance;
              const isPrimary = act === "Hit" || act === "Stand";
              const shortcut = act === "Hit" ? "H" : act === "Stand" ? "S" : act === "Double" ? "D" : act === "Split" ? "P" : "";

              return (
                <button
                  key={act}
                  onClick={() => onChoose(act)}
                  className={`btn ${isPrimary ? "action-primary" : "action-secondary"} ${disabled ? "disabled" : ""}`}
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
                <strong>Suboptimal Decision</strong>
                <button className="close-btn" onClick={() => setMoreInfo(null)}>×</button>
              </div>
              <div className="small" style={{ marginBottom: 8 }}>
                Best: <b>{lastDecision.best}</b> · You chose: <b>{lastDecision.chosen}</b>
              </div>
              {infoHint && infoHint.blurb && (
                <div className="explanation-text">{infoHint.blurb}</div>
              )}
              {extraTip && <div className="tip-highlight">{extraTip}</div>}
              {evStats ? (
                <div className="ev-stats">
                  <div className="ev-row">
                    <span>EV:</span>
                    <span>
                      Best <strong style={{color: evStats.best.ev > 0.05 ? 'var(--brand)' : evStats.best.ev < -0.05 ? 'var(--error)' : 'var(--muted)'}}>{evStats.best.ev.toFixed(3)}</strong> vs Yours <strong style={{color: evStats.chosen.ev > 0.05 ? 'var(--brand)' : evStats.chosen.ev < -0.05 ? 'var(--error)' : 'var(--muted)'}}>{evStats.chosen.ev.toFixed(3)}</strong>
                    </span>
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
              {awaitingAdvance && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--outline)" }}>
                  <button
                    onClick={continueAdvance}
                    className="btn primary"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Continue <span className="kbd-hint">Space</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Desktop Bottom Controls */}
          <div
            className="desktop-controls"
            style={{
              marginTop: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{display: "flex", justifyContent: "flex-end"}}>
              <button
                onClick={() => (awaitingAdvance ? continueAdvance() : spawn())}
                className="btn"
                disabled={locked && !awaitingAdvance}
                style={{minWidth: "180px"}}
              >
                <Repeat size={16} />{" "}
                {awaitingAdvance ? "Continue" : "Next Scenario"}
                <span className="kbd-hint">{awaitingAdvance ? "Space" : "N"}</span>
              </button>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                onClick={() => setShowSpeedTrial(true)}
                className="btn"
                style={{
                  flex: 1,
                  background: "#ffffff",
                  color: "var(--ink)",
                  borderLeft: "3px solid var(--warning)",
                  fontWeight: "700"
                }}
              >
                <Zap size={16} /> Speed Trial
              </button>
              <div style={{ position: "relative", flex: 1 }}>
                <button
                  onClick={() => setShowLearningTools((v) => !v)}
                  className="btn"
                  style={{
                    width: "100%",
                    justifyContent: "center"
                  }}
                >
                  <GraduationCap size={16} /> Learning Tools <ChevronDown size={14} style={{ marginLeft: "4px" }} />
                </button>
                {showLearningTools && learningToolsMenu}
              </div>
            </div>
          </div>
        </div>

        <div className="footer desktop-controls">
          Casino Trainer · Blackjack (S17/DAS). Strategy-only grading; EV from
          Monte Carlo estimates (infinite shoe) for teaching. House rules may
          change results slightly.
        </div>

        {/* Mobile Action Dock */}
        <div className="mobile-action-dock">
          {/* Primary Actions: 2x2 Grid */}
          <div className="mobile-actions-grid">
            <button
              onClick={() => onChoose('Hit')}
              className="btn primary mobile-action-btn"
              disabled={locked || awaitingAdvance}
            >
              Hit <span className="kbd-hint">H</span>
            </button>
            <button
              onClick={() => onChoose('Stand')}
              className="btn primary mobile-action-btn"
              disabled={locked || awaitingAdvance}
            >
              Stand <span className="kbd-hint">S</span>
            </button>
            <button
              onClick={() => onChoose('Double')}
              className="btn mobile-action-btn"
              disabled={locked || awaitingAdvance}
            >
              Double <span className="kbd-hint">D</span>
            </button>
            {isPair(hands[active] || []) && (
              <button
                onClick={() => onChoose('Split')}
                className="btn mobile-action-btn"
                disabled={locked || awaitingAdvance}
              >
                Split <span className="kbd-hint">P</span>
              </button>
            )}
          </div>

          {/* Secondary Row: Next Scenario + Tools */}
          <div className="mobile-secondary-row">
            <button
              onClick={() => (awaitingAdvance ? continueAdvance() : spawn())}
              className="btn mobile-secondary-btn"
              disabled={locked && !awaitingAdvance}
            >
              <Repeat size={14} /> {awaitingAdvance ? "Continue" : "Next"}
            </button>
            <button
              onClick={() => setShowSpeedTrial(true)}
              className="btn mobile-secondary-btn"
              style={{borderLeft: "3px solid var(--warning)"}}
            >
              <Zap size={14} /> Speed Trial
            </button>
            <button
              onClick={() => setShowLearningTools((v) => !v)}
              className="btn mobile-secondary-btn"
              style={{position: "relative"}}
            >
              <GraduationCap size={14} /> Tools
              {showLearningTools && learningToolsMenu}
            </button>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}
