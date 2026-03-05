import { coordsToSgf } from "../components/goLogic";
import type { GameState } from "../components/goLogic";

export function exportStateToSgf(state: GameState): string {
  const head = `(;GM[1]FF[4]CA[UTF-8]AP[GO:1.0]SZ[${state.size}]`;
  const body = state.moves
    .map((m) => {
      if (m.pass) return `;${m.color}[]`;
      if (typeof m.row !== "number" || typeof m.col !== "number") return "";
      return `;${m.color}[${coordsToSgf(m.row, m.col)}]`;
    })
    .join("");

  return `${head}${body})`;
}
