import type { GameEngine, GameStateBase, Player, AIDifficulty } from "./types";

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1]
];

function inBounds(size: number, row: number, col: number): boolean {
  return row >= 0 && row < size && col >= 0 && col < size;
}

function initialBoard(): string[][] {
  const size = 8;
  const board = Array.from({ length: size }, () => Array.from({ length: size }, () => ""));
  board[3][3] = "W";
  board[3][4] = "B";
  board[4][3] = "B";
  board[4][4] = "W";
  return board;
}

function collectFlips(board: string[][], row: number, col: number, player: Player): Array<[number, number]> {
  const enemy = player === "B" ? "W" : "B";
  const flips: Array<[number, number]> = [];

  for (const [dr, dc] of DIRS) {
    const line: Array<[number, number]> = [];
    let nr = row + dr;
    let nc = col + dc;
    while (inBounds(board.length, nr, nc) && board[nr][nc] === enemy) {
      line.push([nr, nc]);
      nr += dr;
      nc += dc;
    }
    if (inBounds(board.length, nr, nc) && board[nr][nc] === player && line.length) {
      flips.push(...line);
    }
  }

  return flips;
}

function hasAnyMove(state: GameStateBase, player: Player): boolean {
  for (let r = 0; r < state.size; r += 1) {
    for (let c = 0; c < state.size; c += 1) {
      if (state.board[r][c] !== "") continue;
      if (collectFlips(state.board, r, c, player).length) return true;
    }
  }
  return false;
}

function countScore(board: string[][]): { B: number; W: number } {
  let B = 0;
  let W = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell === "B") B += 1;
      if (cell === "W") W += 1;
    }
  }
  return { B, W };
}

export const othelloEngine: GameEngine = {
  id: "othello",
  name: "黑白棋 Othello",
  sizeOptions: [8],
  supportsPuzzle: false,
  canPass: true,
  rules: [
    "棋盤 8x8，黑先。",
    "落子必須夾住對手棋子並翻轉。",
    "雙方皆無可下位置時結束，子多者勝。"
  ],
  init() {
    const board = initialBoard();
    return {
      size: 8,
      board,
      turn: "B",
      moves: [],
      lastMove: null,
      gameOver: false,
      winner: null
    };
  },
  isLegal(state, row, col) {
    return inBounds(state.size, row, col) && state.board[row][col] === "" && collectFlips(state.board, row, col, state.turn).length > 0;
  },
  applyMove(state, row, col) {
    if (!this.isLegal(state, row, col)) return state;
    const board = state.board.map((r) => [...r]);
    const flips = collectFlips(board, row, col, state.turn);
    board[row][col] = state.turn;
    flips.forEach(([r, c]) => (board[r][c] = state.turn));

    let nextTurn: Player = state.turn === "B" ? "W" : "B";
    const nextState: GameStateBase = {
      ...state,
      board,
      turn: nextTurn,
      lastMove: { row, col },
      moves: [...state.moves, { row, col, player: state.turn }]
    };

    if (!hasAnyMove(nextState, nextTurn)) {
      nextTurn = state.turn;
      if (!hasAnyMove(nextState, nextTurn)) {
        const score = countScore(board);
        const winner = score.B === score.W ? "D" : score.B > score.W ? "B" : "W";
        return { ...nextState, turn: nextTurn, gameOver: true, winner };
      }
    }

    return { ...nextState, turn: nextTurn };
  },
  aiMove(state, difficulty: AIDifficulty) {
    const options: Array<{ row: number; col: number; flips: number }> = [];
    for (let r = 0; r < state.size; r += 1) {
      for (let c = 0; c < state.size; c += 1) {
        if (state.board[r][c] !== "") continue;
        const flips = collectFlips(state.board, r, c, state.turn).length;
        if (flips > 0) options.push({ row: r, col: c, flips });
      }
    }
    if (!options.length) return null;

    if (difficulty === "easy") return options[Math.floor(Math.random() * options.length)];
    options.sort((a, b) => b.flips - a.flips);
    if (difficulty === "hard") return options[0];
    return options[Math.floor(Math.random() * Math.min(4, options.length))];
  }
};
