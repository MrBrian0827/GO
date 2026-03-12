export interface SaveStateLike {
  size: number;
  board: Array<Array<string | null>>;
  turn: string;
  moves: Array<{ row?: number; col?: number; player?: string; color?: string; pass?: boolean }>;
  lastMove: { row: number; col: number } | null;
  gameOver: boolean;
  winner: string | null;
  moveNumber?: number;
  passCount?: number;
  captures?: { B: number; W: number };
  koPoint?: { row: number; col: number } | null;
  previousBoardHash?: string | null;
}

export interface SaveSlot {
  id: number;
  label: string;
  savedAt: string;
  preview: string;
  state: SaveStateLike;
}

function stoneColor(cell: string | null): string {
  if (cell === "B") return "#101010";
  if (cell === "W") return "#fafafa";
  return "transparent";
}

function buildPreviewSvg(state: SaveStateLike): string {
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
      if (!cell || cell === "") continue;
      const x = margin + c * step;
      const y = margin + r * step;
      const fill = stoneColor(cell === "" ? null : cell);
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

export function saveToSlots(storageKey: string, label: string, state: SaveStateLike): SaveSlot[] {
  const existing = loadSlots(storageKey);
  const newSlot: SaveSlot = {
    id: Date.now(),
    label,
    savedAt: new Date().toLocaleString(),
    preview: buildPreviewSvg(state),
    state
  };

  const next = [newSlot, ...existing].slice(0, 3);
  localStorage.setItem(storageKey, JSON.stringify(next));
  return next;
}
