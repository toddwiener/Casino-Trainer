import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Timer, Trophy, CheckCircle, XCircle, X } from "lucide-react";

/**
 * SpeedTrial Component
 *
 * Provides Sprint (10 decisions / 30s) and Marathon (50 decisions / 150s) modes
 * - ONE decision per hand (not playing out full hands)
 * - Scoring: +100 correct, -50 wrong, -5pts/sec penalty over 2s
 * - Pre-generated scenarios for consistent timing
 */

const SpeedTrial = ({ generateScenario, bestAction, onClose }) => {
  const [view, setView] = useState("menu"); // 'menu' | 'playing' | 'results'
  const [trialType, setTrialType] = useState(null); // 'sprint' | 'marathon'
  const [scenarios, setScenarios] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [decisions, setDecisions] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(null);

  // Timer countdown
  useEffect(() => {
    if (view !== "playing") return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          endTrial();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [view]);

  // Keyboard shortcuts
  useEffect(() => {
    if (view !== "playing" || !scenarios[currentIndex]) return;

    const handleKeyPress = (e) => {
      const key = e.key.toLowerCase();
      const scenario = scenarios[currentIndex];

      if (key === "h") {
        e.preventDefault();
        makeDecision("Hit");
      } else if (key === "s") {
        e.preventDefault();
        makeDecision("Stand");
      } else if (key === "d") {
        e.preventDefault();
        makeDecision("Double");
      } else if (key === "p" && scenario && isPair(scenario.player)) {
        e.preventDefault();
        makeDecision("Split");
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [view, scenarios, currentIndex, decisions, score]);

  const startTrial = (type) => {
    const count = type === "sprint" ? 10 : 50;
    const timeLimit = type === "sprint" ? 30 : 150;

    // Pre-generate all scenarios
    const difficulties = ["Easy", "Medium", "Hard"];
    const generatedScenarios = [];
    for (let i = 0; i < count; i++) {
      const difficulty = difficulties[Math.floor(Math.random() * 3)];
      generatedScenarios.push(generateScenario(difficulty));
    }

    setTrialType(type);
    setScenarios(generatedScenarios);
    setCurrentIndex(0);
    setDecisions([]);
    setScore(0);
    setTimeLeft(timeLimit);
    setStartTime(Date.now());
    setView("playing");
  };

  const makeDecision = (action) => {
    if (view !== "playing") return;

    const scenario = scenarios[currentIndex];
    const correct = bestAction(scenario.player, scenario.dealerUp);
    const isCorrect = action === correct.action;
    const decisionTime = Date.now();

    // Calculate time for THIS decision only
    const lastTime =
      decisions.length > 0
        ? decisions[decisions.length - 1].timestamp
        : startTime;
    const timeTaken = (decisionTime - lastTime) / 1000;

    // Calculate points: +100 correct, -50 wrong, -5pts/sec penalty over 2s
    let points = isCorrect ? 100 : -50;
    const timeOverTwo = Math.max(0, timeTaken - 2);
    points -= Math.floor(timeOverTwo * 5);

    const decision = {
      scenario,
      chosen: action,
      correct: correct.action,
      isCorrect,
      timeTaken,
      points,
      timestamp: decisionTime,
    };

    const newDecisions = [...decisions, decision];
    const newScore = score + points;

    setDecisions(newDecisions);
    setScore(newScore);

    // Check if trial is complete
    if (currentIndex + 1 >= scenarios.length) {
      endTrial();
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const endTrial = () => {
    setView("results");
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentScenario = scenarios[currentIndex];
  const totalDecisions = scenarios.length;
  const correctDecisions = decisions.filter((d) => d.isCorrect).length;
  const accuracy =
    decisions.length > 0 ? (correctDecisions / decisions.length) * 100 : 0;

  return (
    <div className="speed-trial-overlay" onClick={onClose}>
      <motion.div
        className="speed-trial-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        {/* Menu View */}
        {view === "menu" && (
          <div className="speed-trial-content">
            <div className="speed-trial-header">
              <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Zap size={24} /> Speed Trial
              </h2>
              <button className="strategy-close" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: "24px" }}>
              <p style={{ marginTop: 0, marginBottom: "24px", color: "#5f6b7a" }}>
                Test your speed and accuracy with timed challenges. Make ONE decision per hand.
              </p>

              <div className="speed-trial-modes">
                <div className="speed-trial-mode">
                  <div className="mode-header">
                    <Timer size={20} />
                    <h3>Sprint</h3>
                  </div>
                  <p className="mode-desc">10 decisions in 30 seconds</p>
                  <p className="mode-target">Target: 3 seconds per decision</p>
                  <button
                    className="btn primary"
                    style={{ width: "100%", justifyContent: "center" }}
                    onClick={() => startTrial("sprint")}
                  >
                    Start Sprint
                  </button>
                </div>

                <div className="speed-trial-mode">
                  <div className="mode-header">
                    <Trophy size={20} />
                    <h3>Marathon</h3>
                  </div>
                  <p className="mode-desc">50 decisions in 150 seconds</p>
                  <p className="mode-target">Target: 3 seconds per decision</p>
                  <button
                    className="btn primary"
                    style={{ width: "100%", justifyContent: "center" }}
                    onClick={() => startTrial("marathon")}
                  >
                    Start Marathon
                  </button>
                </div>
              </div>

              <div className="speed-trial-scoring">
                <h4>Scoring:</h4>
                <ul>
                  <li>+100 points for correct decision</li>
                  <li>-50 points for incorrect decision</li>
                  <li>-5 points per second over 2 seconds</li>
                  <li>First 2 seconds are free (no time penalty)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Playing View */}
        {view === "playing" && currentScenario && (
          <div className="speed-trial-content">
            <div className="speed-trial-header">
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
                  <Zap size={24} />
                  {trialType === "sprint" ? "Sprint" : "Marathon"}
                </h2>
                <div className="speed-trial-progress">
                  {currentIndex + 1} / {totalDecisions}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div className="speed-trial-timer">
                  <Timer size={16} />
                  {formatTime(timeLeft)}
                </div>
                <div className="speed-trial-score">
                  Score: <strong>{score}</strong>
                </div>
              </div>
            </div>

            <div style={{ padding: "24px" }}>
              <div className="table">
                <div className="grid">
                  <div className="section">
                    <h4>Dealer's Up Card</h4>
                    <div className="cardrow">
                      {renderCard(currentScenario.dealerUp)}
                    </div>
                  </div>
                  <div className="section">
                    <h4>Your Hand</h4>
                    <div className="cardrow">
                      {currentScenario.player.map((c, i) => (
                        <React.Fragment key={i}>{renderCard(c)}</React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="actions">
                  <button
                    className="btn"
                    onClick={() => makeDecision("Hit")}
                  >
                    Hit <span className="kbd-hint">H</span>
                  </button>
                  <button
                    className="btn"
                    onClick={() => makeDecision("Stand")}
                  >
                    Stand <span className="kbd-hint">S</span>
                  </button>
                  <button
                    className="btn"
                    onClick={() => makeDecision("Double")}
                  >
                    Double <span className="kbd-hint">D</span>
                  </button>
                  {isPair(currentScenario.player) && (
                    <button
                      className="btn"
                      onClick={() => makeDecision("Split")}
                    >
                      Split <span className="kbd-hint">P</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results View */}
        {view === "results" && (
          <div className="speed-trial-content">
            <div className="speed-trial-header">
              <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Trophy size={24} /> Trial Complete!
              </h2>
              <button className="strategy-close" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: "24px" }}>
              <div className="speed-trial-results">
                <div className="results-summary">
                  <div className="result-stat">
                    <div className="result-value">{score}</div>
                    <div className="result-label">Final Score</div>
                  </div>
                  <div className="result-stat">
                    <div className="result-value">{accuracy.toFixed(1)}%</div>
                    <div className="result-label">Accuracy</div>
                  </div>
                  <div className="result-stat">
                    <div className="result-value">{correctDecisions}/{decisions.length}</div>
                    <div className="result-label">Correct</div>
                  </div>
                </div>

                <div className="results-details">
                  <h4>Decision Breakdown:</h4>
                  <div className="results-list">
                    {decisions.map((d, i) => (
                      <div key={i} className={`result-item ${d.isCorrect ? "correct" : "incorrect"}`}>
                        <div className="result-icon">
                          {d.isCorrect ? (
                            <CheckCircle size={16} />
                          ) : (
                            <XCircle size={16} />
                          )}
                        </div>
                        <div className="result-hand">
                          Hand {handToString(d.scenario.player)} vs {d.scenario.dealerUp.rank}
                        </div>
                        <div className="result-decision">
                          {d.chosen} {!d.isCorrect && `(should be ${d.correct})`}
                        </div>
                        <div className="result-time">{d.timeTaken.toFixed(1)}s</div>
                        <div className={`result-points ${d.points >= 0 ? "positive" : "negative"}`}>
                          {d.points >= 0 ? "+" : ""}{d.points}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                  <button
                    className="btn primary"
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={() => startTrial(trialType)}
                  >
                    Try Again
                  </button>
                  <button
                    className="btn"
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={() => setView("menu")}
                  >
                    Back to Menu
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Helper functions
function renderCard(card) {
  if (!card) return null;
  const isRed = card.suit === "♥" || card.suit === "♦";
  return (
    <div className={`card ${isRed ? "red" : ""}`}>
      <div className="rank">{card.rank}</div>
      <div className="pip">{card.suit}</div>
      <div className="rank-btm">{card.rank}</div>
    </div>
  );
}

function handToString(hand) {
  return hand.map((c) => c.rank).join(",");
}

function isPair(hand) {
  if (!hand || hand.length !== 2) return false;
  const [a, b] = hand;
  // Check if both cards have the same rank, or both are Aces
  if (a.rank === b.rank) return true;
  if (a.rank === "A" && b.rank === "A") return true;
  return false;
}

export default SpeedTrial;
