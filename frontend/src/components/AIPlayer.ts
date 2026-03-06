import { isLegalMove, opposite, playMove, scoreBySimpleStoneCount } from "./goLogic";
import type { GameState, StoneColor } from "./goLogic";

export type AIDifficulty = "easy" | "medium" | "hard";

interface Candidate {
  row: number;
  col: number;
  nextState: GameState;
  captureGain: number;
  score: number;
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

function nearbyInfluence(state: GameState, row: number, col: number, color: StoneColor): number {
  let score = 0;
  const enemy = opposite(color);

  for (const [dr, dc] of dirs) {
    const nr = row + dr;
    const nc = col + dc;
    if (!inBounds(state.size, nr, nc)) {
      score += 0.25;
      continue;
    }

    const cell = state.board[nr][nc];
    if (cell === color) score += 1.3;
    if (cell === enemy) score += 0.95;
    if (cell === null) score += 0.35;
  }

  const center = (state.size - 1) / 2;
  const distance = Math.abs(row - center) + Math.abs(col - center);
  score += Math.max(0, 3.2 - distance * 0.22);
  return score;
}

function estimateTerritory(state: GameState, color: StoneColor): number {
  const enemy = opposite(color);
  let own = 0;
  let opp = 0;

  for (let row = 0; row < state.size; row += 1) {
    for (let col = 0; col < state.size; col += 1) {
      const cell = state.board[row][col];
      if (cell === color) own += 1;
      if (cell === enemy) opp += 1;
      if (cell !== null) continue;

      let nearOwn = 0;
      let nearOpp = 0;
      for (const [dr, dc] of dirs) {
        const nr = row + dr;
        const nc = col + dc;
        if (!inBounds(state.size, nr, nc)) continue;
        if (state.board[nr][nc] === color) nearOwn += 1;
        if (state.board[nr][nc] === enemy) nearOpp += 1;
      }

      if (nearOwn > nearOpp) own += 0.5;
      if (nearOpp > nearOwn) opp += 0.5;
    }
  }

  return own - opp;
}

function evaluateBoard(state: GameState, color: StoneColor): number {
  const enemy = opposite(color);
  const territory = estimateTerritory(state, color);
  const captureDiff = state.captures[color] - state.captures[enemy];
  const winBonus = state.gameOver ? (scoreBySimpleStoneCount(state) === color ? 10 : -10) : 0;
  return territory + captureDiff * 2.5 + winBonus;
}

function legalMoves(state: GameState, aiColor: StoneColor): Candidate[] {
  const out: Candidate[] = [];

  for (let row = 0; row < state.size; row += 1) {
    for (let col = 0; col < state.size; col += 1) {
      if (!isLegalMove(state, row, col)) continue;

      const before = state.captures[state.turn];
      const result = playMove(state, row, col);
      if (!result.ok) continue;

      const captureGain = result.state.captures[state.turn] - before;
      const score =
        captureGain * 12 +
        nearbyInfluence(state, row, col, aiColor) +
        evaluateBoard(result.state, aiColor) -
        evaluateBoard(state, aiColor) * 0.4;

      out.push({ row, col, nextState: result.state, captureGain, score });
    }
  }

  return out;
}

function chooseEasy(candidates: Candidate[]): Candidate {
  const sorted = [...candidates].sort((a, b) => b.captureGain - a.captureGain);
  const top = sorted.slice(0, Math.min(8, sorted.length));
  return top[Math.floor(Math.random() * top.length)];
}

function chooseMedium(candidates: Candidate[]): Candidate {
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const top = sorted.slice(0, Math.min(6, sorted.length));
  const weighted = top.map((m) => Math.max(0.1, m.score));
  const total = weighted.reduce((s, n) => s + n, 0);
  let roll = Math.random() * total;

  for (let i = 0; i < top.length; i += 1) {
    roll -= weighted[i];
    if (roll <= 0) return top[i];
  }

  return top[0];
}

function chooseHard(candidates: Candidate[], aiColor: StoneColor): Candidate {
  const enemy = opposite(aiColor);
  const scored = candidates.map((candidate) => {
    const enemyReplies = legalMoves(candidate.nextState, enemy).slice(0, 22);
    const worstReply = enemyReplies.length ? Math.max(...enemyReplies.map((r) => r.score)) : 0;
    return {
      candidate,
      score: candidate.score + evaluateBoard(candidate.nextState, aiColor) - worstReply * 0.68
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].candidate;
}

function shouldPass(
  state: GameState,
  difficulty: AIDifficulty,
  bestScoreDelta: number,
  legalCount: number
): boolean {
  if (!legalCount) return true;

  const moveCount = state.moves.length;
  const lateGame = moveCount > state.size * 1.7;

  if (difficulty === "easy") {
    return lateGame && bestScoreDelta < 0.25;
  }

  if (difficulty === "medium") {
    return lateGame && bestScoreDelta < 0.45;
  }

  return lateGame && bestScoreDelta < 0.7;
}

export function chooseAIMove(
  state: GameState,
  aiColor: StoneColor,
  difficulty: AIDifficulty = "easy"
): { row: number; col: number } | null {
  if (state.turn !== aiColor || state.gameOver) return null;

  const candidates = legalMoves(state, aiColor);
  if (!candidates.length) return null;

  const baseScore = evaluateBoard(state, aiColor);

  let pick: Candidate;
  if (difficulty === "easy") pick = chooseEasy(candidates);
  else if (difficulty === "medium") pick = chooseMedium(candidates);
  else pick = chooseHard(candidates, aiColor);

  const bestAfter = evaluateBoard(pick.nextState, aiColor);
  const delta = bestAfter - baseScore;

  if (shouldPass(state, difficulty, delta, candidates.length)) return null;

  return { row: pick.row, col: pick.col };
}
