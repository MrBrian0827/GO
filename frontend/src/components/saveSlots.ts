import type { GameState } from "./goLogic";

export interface SaveSlot {
  id: number;
  label: string;
  savedAt: string;
  preview: string;
  state: Pick<GameState, "size" | "board" | "turn" | "captures" | "moves" | "moveNumber" | "lastMove" | "passCount" | "gameOver" | "winner" | "koPoint" | "previousBoardHash">;
}

function stoneColor(cell: "B" | "W" | null): string {
  if (cell === "B") return "#101010";
  if (cell === "W") return "#fafafa";
  return "transparent";
}

function buildPreviewSvg(state: GameState): string {
  const sizePx = 170;
  const margin = 14;
  const step = (sizePx - margin * 2) / (state.size - 1);

  const lines: string[] = [];
  for (let i = 0; i < state.size; i += 1) {
    const p = margin + i * step;
    lines.push(`<line x1="${margin}" y1="${p}" x2="${sizePx - margin}" y2="${p}" stroke="#5f3f14" stroke-width="1" />`);
    lines.push(`<line x1="${p}" y1="${margin}" x2="${p}" y2="${sizePx - margin}" stroke="#5f3f14" stroke-width="1" />`);
  }

  const stones: string[] = [];
  for (let r = 0; r < state.size; r += 1) {
    for (let c = 0; c < state.size; c += 1) {
      const cell = state.board[r][c];
      if (!cell) continue;
      const x = margin + c * step;
      const y = margin + r * step;
      const fill = stoneColor(cell);
      const stroke = cell === "B" ? "#000" : "#9ca3af";
      stones.push(`<circle cx="${x}" cy="${y}" r="${Math.max(2.5, step * 0.34)}" fill="${fill}" stroke="${stroke}" stroke-width="0.8" />`);
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sizePx} ${sizePx}"><rect width="${sizePx}" height="${sizePx}" rx="10" fill="#d8aa61"/>${lines.join("")}${stones.join("")}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function loadSlots(storageKey: string): SaveSlot[] {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as SaveSlot[];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 3);
  } catch {
    return [];
  }
}

export function saveToSlots(storageKey: string, label: string, state: GameState): SaveSlot[] {
  const existing = loadSlots(storageKey);
  const newSlot: SaveSlot = {
    id: Date.now(),
    label,
    savedAt: new Date().toLocaleString(),
    preview: buildPreviewSvg(state),
    state: {
      size: state.size,
      board: state.board,
      turn: state.turn,
      captures: state.captures,
      moves: state.moves,
      moveNumber: state.moveNumber,
      lastMove: state.lastMove,
      passCount: state.passCount,
      gameOver: state.gameOver,
      winner: state.winner,
      koPoint: state.koPoint,
      previousBoardHash: state.previousBoardHash
    }
  };

  const next = [newSlot, ...existing].slice(0, 3);
  localStorage.setItem(storageKey, JSON.stringify(next));
  return next;
}
