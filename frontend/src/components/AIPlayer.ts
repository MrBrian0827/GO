import { isLegalMove, opposite, playMove } from "./goLogic";
import type { GameState, StoneColor } from "./goLogic";

export type AIDifficulty = "easy" | "medium" | "hard";

interface Candidate {
  row: number;
  col: number;
  nextState: GameState;
  captureGain: number;
}

const dirs = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1]
];

function inBounds(size: number, row: number, col: number): boolean {
  return row >= 0 && row < size && col >= 0 && col < size;
}

function legalMoves(state: GameState): Candidate[] {
  const out: Candidate[] = [];

  for (let row = 0; row < state.size; row += 1) {
    for (let col = 0; col < state.size; col += 1) {
      if (!isLegalMove(state, row, col)) continue;
      const before = state.captures[state.turn];
      const result = playMove(state, row, col);
      if (!result.ok) continue;
      out.push({
        row,
        col,
        nextState: result.state,
        captureGain: result.state.captures[state.turn] - before
      });
    }
  }

  return out;
}

function localShapeScore(state: GameState, row: number, col: number, color: StoneColor): number {
  let score = 0;
  const enemy = opposite(color);

  for (const [dr, dc] of dirs) {
    const nr = row + dr;
    const nc = col + dc;
    if (!inBounds(state.size, nr, nc)) {
      score += 0.4;
      continue;
    }

    const cell = state.board[nr][nc];
    if (cell === color) score += 1.4;
    if (cell === enemy) score += 0.8;
    if (cell === null) score += 0.3;
  }

  const center = (state.size - 1) / 2;
  const distanceToCenter = Math.abs(row - center) + Math.abs(col - center);
  score += Math.max(0, 3 - distanceToCenter * 0.2);

  return score;
}

function evaluatePosition(state: GameState, aiColor: StoneColor): number {
  const enemy = opposite(aiColor);
  let aiStones = state.captures[aiColor] * 4;
  let enemyStones = state.captures[enemy] * 4;

  for (let row = 0; row < state.size; row += 1) {
    for (let col = 0; col < state.size; col += 1) {
      const cell = state.board[row][col];
      if (cell === aiColor) aiStones += 1;
      if (cell === enemy) enemyStones += 1;
    }
  }

  return aiStones - enemyStones;
}

function pickByWeightedRandom(candidates: Array<{ move: Candidate; score: number }>): Candidate {
  const sorted = candidates.sort((a, b) => b.score - a.score);
  const top = sorted.slice(0, Math.max(2, Math.min(6, sorted.length)));
  const total = top.reduce((sum, it) => sum + Math.max(it.score, 0.1), 0);
  let roll = Math.random() * total;

  for (const item of top) {
    roll -= Math.max(item.score, 0.1);
    if (roll <= 0) return item.move;
  }

  return top[0].move;
}

function chooseMedium(candidates: Candidate[], state: GameState, aiColor: StoneColor): Candidate {
  const scored = candidates.map((move) => ({
    move,
    score:
      move.captureGain * 18 +
      localShapeScore(state, move.row, move.col, aiColor) +
      evaluatePosition(move.nextState, aiColor) * 0.6
  }));

  return pickByWeightedRandom(scored);
}

function chooseHard(candidates: Candidate[], state: GameState, aiColor: StoneColor): Candidate {
  const enemy = opposite(aiColor);

  const scored = candidates.map((move) => {
    const baseScore =
      move.captureGain * 24 +
      localShapeScore(state, move.row, move.col, aiColor) +
      evaluatePosition(move.nextState, aiColor);

    const enemyMoves = legalMoves(move.nextState)
      .slice(0, 28)
      .map((m) => {
        const pressure = m.captureGain * 20 + localShapeScore(move.nextState, m.row, m.col, enemy);
        return pressure;
      });

    const worstEnemy = enemyMoves.length ? Math.max(...enemyMoves) : 0;
    return { move, score: baseScore - worstEnemy * 0.55 };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].move;
}

export function chooseAIMove(
  state: GameState,
  aiColor: StoneColor,
  difficulty: AIDifficulty = "easy"
): { row: number; col: number } | null {
  if (state.turn !== aiColor || state.gameOver) return null;

  const moves = legalMoves(state);
  if (!moves.length) return null;

  if (difficulty === "easy") {
    const pick = moves[Math.floor(Math.random() * moves.length)];
    return { row: pick.row, col: pick.col };
  }

  if (difficulty === "medium") {
    const pick = chooseMedium(moves, state, aiColor);
    return { row: pick.row, col: pick.col };
  }

  const pick = chooseHard(moves, state, aiColor);
  return { row: pick.row, col: pick.col };
}
