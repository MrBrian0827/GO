import { createInitialState, passTurn, playMove, sgfToCoords } from "../components/goLogic";
import type { GameState } from "../components/goLogic";

function readSize(sgf: string): number {
  const match = sgf.match(/SZ\[(\d{1,2})\]/);
  if (!match) return 19;
  const size = Number(match[1]);
  if (size < 5 || size > 19) return 19;
  return size;
}

export function importSgfToState(sgf: string): GameState {
  const size = readSize(sgf);
  let state = createInitialState(size);

  const moves = [...sgf.matchAll(/;([BW])\[([^\]]*)\]/g)];
  for (const move of moves) {
    const color = move[1] as "B" | "W";
    const point = move[2];

    if (state.turn !== color) {
      state = passTurn(state);
    }

    if (!point) {
      state = passTurn(state);
      continue;
    }

    const coords = sgfToCoords(point);
    if (!coords) continue;

    const result = playMove(state, coords.row, coords.col);
    if (result.ok) state = result.state;
  }

  return state;
}
