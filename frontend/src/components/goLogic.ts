export type StoneColor = "B" | "W";
export type Cell = StoneColor | null;

export interface MoveRecord {
  color: StoneColor;
  row?: number;
  col?: number;
  pass?: boolean;
}

export interface GameState {
  size: number;
  board: Cell[][];
  turn: StoneColor;
  captures: Record<StoneColor, number>;
  lastMove: { row: number; col: number } | null;
  koPoint: { row: number; col: number } | null;
  previousBoardHash: string | null;
  passCount: number;
  moveNumber: number;
  gameOver: boolean;
  winner: StoneColor | "D" | null;
  moves: MoveRecord[];
}

export interface MoveResult {
  ok: boolean;
  state: GameState;
  message?: string;
}

const dirs = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1]
];

export const opposite = (color: StoneColor): StoneColor => (color === "B" ? "W" : "B");

export function createEmptyBoard(size: number): Cell[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null));
}

export function createInitialState(size: number): GameState {
  return {
    size,
    board: createEmptyBoard(size),
    turn: "B",
    captures: { B: 0, W: 0 },
    lastMove: null,
    koPoint: null,
    previousBoardHash: null,
    passCount: 0,
    moveNumber: 0,
    gameOver: false,
    winner: null,
    moves: []
  };
}

export function boardHash(board: Cell[][]): string {
  return board.map((r) => r.map((c) => c ?? ".").join("")).join("/");
}

function inBounds(size: number, row: number, col: number): boolean {
  return row >= 0 && row < size && col >= 0 && col < size;
}

function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map((row) => [...row]);
}

function getGroup(board: Cell[][], row: number, col: number): Array<[number, number]> {
  const color = board[row][col];
  if (!color) return [];

  const size = board.length;
  const stack: Array<[number, number]> = [[row, col]];
  const visited = new Set<string>();
  const group: Array<[number, number]> = [];

  while (stack.length) {
    const [r, c] = stack.pop()!;
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    visited.add(key);
    group.push([r, c]);

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (!inBounds(size, nr, nc)) continue;
      if (board[nr][nc] === color) stack.push([nr, nc]);
    }
  }

  return group;
}

function countLiberties(board: Cell[][], group: Array<[number, number]>): number {
  const size = board.length;
  const liberties = new Set<string>();

  for (const [r, c] of group) {
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (!inBounds(size, nr, nc)) continue;
      if (board[nr][nc] === null) liberties.add(`${nr},${nc}`);
    }
  }

  return liberties.size;
}

function removeGroup(board: Cell[][], group: Array<[number, number]>): number {
  for (const [r, c] of group) {
    board[r][c] = null;
  }
  return group.length;
}

function hasStone(board: Cell[][]): boolean {
  return board.some((r) => r.some((c) => c !== null));
}

export function scoreBySimpleStoneCount(state: GameState): StoneColor | "D" {
  const counts = { B: state.captures.B, W: state.captures.W };
  for (const row of state.board) {
    for (const cell of row) {
      if (cell) counts[cell] += 1;
    }
  }
  if (counts.B === counts.W) return "D";
  return counts.B > counts.W ? "B" : "W";
}

export function isLegalMove(state: GameState, row: number, col: number): boolean {
  return playMove(state, row, col).ok;
}

export function playMove(state: GameState, row: number, col: number): MoveResult {
  if (state.gameOver) return { ok: false, state, message: "對局已結束" };
  if (!inBounds(state.size, row, col)) return { ok: false, state, message: "超出棋盤" };
  if (state.board[row][col] !== null) return { ok: false, state, message: "此點已有棋子" };
  if (state.koPoint && state.koPoint.row === row && state.koPoint.col === col) {
    return { ok: false, state, message: "Ko 禁著點" };
  }

  const currentHash = boardHash(state.board);
  const board = cloneBoard(state.board);
  board[row][col] = state.turn;

  const enemy = opposite(state.turn);
  let captured = 0;
  let capturedGroupSinglePoint: { row: number; col: number } | null = null;

  for (const [dr, dc] of dirs) {
    const nr = row + dr;
    const nc = col + dc;
    if (!inBounds(state.size, nr, nc)) continue;
    if (board[nr][nc] !== enemy) continue;

    const group = getGroup(board, nr, nc);
    const libs = countLiberties(board, group);
    if (libs === 0) {
      if (group.length === 1) capturedGroupSinglePoint = { row: group[0][0], col: group[0][1] };
      captured += removeGroup(board, group);
    }
  }

  const myGroup = getGroup(board, row, col);
  const myLibs = countLiberties(board, myGroup);
  if (myLibs === 0) return { ok: false, state, message: "禁止自殺手" };

  const nextHash = boardHash(board);
  if (state.previousBoardHash && nextHash === state.previousBoardHash) {
    return { ok: false, state, message: "違反 Ko 規則" };
  }

  const nextState: GameState = {
    ...state,
    board,
    turn: enemy,
    captures: {
      ...state.captures,
      [state.turn]: state.captures[state.turn] + captured
    },
    lastMove: { row, col },
    moveNumber: state.moveNumber + 1,
    passCount: 0,
    previousBoardHash: currentHash,
    koPoint: captured === 1 && myGroup.length === 1 && capturedGroupSinglePoint ? capturedGroupSinglePoint : null,
    moves: [...state.moves, { color: state.turn, row, col }]
  };

  return { ok: true, state: nextState };
}

export function passTurn(state: GameState): GameState {
  if (state.gameOver) return state;

  const nextPass = state.passCount + 1;
  const nextState: GameState = {
    ...state,
    turn: opposite(state.turn),
    passCount: nextPass,
    moveNumber: state.moveNumber + 1,
    lastMove: null,
    koPoint: null,
    previousBoardHash: boardHash(state.board),
    moves: [...state.moves, { color: state.turn, pass: true }]
  };

  if (nextPass >= 2 || !hasStone(state.board)) {
    nextState.gameOver = true;
    nextState.winner = scoreBySimpleStoneCount(nextState);
  }

  return nextState;
}

export function replayMoves(size: number, moves: MoveRecord[]): GameState {
  let state = createInitialState(size);

  for (const move of moves) {
    if (move.pass) {
      state = passTurn(state);
      continue;
    }

    if (typeof move.row !== "number" || typeof move.col !== "number") continue;
    const result = playMove(state, move.row, move.col);
    if (result.ok) state = result.state;
  }

  return state;
}

export function undoLastMove(state: GameState, steps = 1): GameState {
  if (steps <= 0 || !state.moves.length) return state;
  const nextMoves = state.moves.slice(0, Math.max(0, state.moves.length - steps));
  return replayMoves(state.size, nextMoves);
}

export function coordsToSgf(row: number, col: number): string {
  return `${String.fromCharCode(97 + col)}${String.fromCharCode(97 + row)}`;
}

export function sgfToCoords(v: string): { row: number; col: number } | null {
  if (!v || v.length < 2) return null;
  const col = v.charCodeAt(0) - 97;
  const row = v.charCodeAt(1) - 97;
  if (row < 0 || col < 0) return null;
  return { row, col };
}
