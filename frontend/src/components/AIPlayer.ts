import { isLegalMove, playMove } from "./goLogic";
import type { GameState, StoneColor } from "./goLogic";

function legalMoves(state: GameState): Array<{ row: number; col: number; capture: number }> {
  const out: Array<{ row: number; col: number; capture: number }> = [];

  for (let row = 0; row < state.size; row += 1) {
    for (let col = 0; col < state.size; col += 1) {
      if (!isLegalMove(state, row, col)) continue;
      const before = state.captures[state.turn];
      const result = playMove(state, row, col);
      if (!result.ok) continue;
      out.push({ row, col, capture: result.state.captures[state.turn] - before });
    }
  }

  return out;
}

export function chooseAIMove(state: GameState, aiColor: StoneColor): { row: number; col: number } | null {
  if (state.turn !== aiColor || state.gameOver) return null;

  const moves = legalMoves(state);
  if (!moves.length) return null;

  const capturesFirst = moves.filter((m) => m.capture > 0);
  const pool = capturesFirst.length ? capturesFirst : moves;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return { row: pick.row, col: pick.col };
}
