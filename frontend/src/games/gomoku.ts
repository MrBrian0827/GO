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

function createBoard(size: number): string[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => ""));
}

function inBounds(size: number, row: number, col: number): boolean {
  return row >= 0 && row < size && col >= 0 && col < size;
}

function checkFive(state: GameStateBase, row: number, col: number, player: Player): boolean {
  for (const [dr, dc] of DIRS) {
    let count = 1;
    for (let step = 1; step < 5; step += 1) {
      const nr = row + dr * step;
      const nc = col + dc * step;
      if (!inBounds(state.size, nr, nc) || state.board[nr][nc] !== player) break;
      count += 1;
    }
    for (let step = 1; step < 5; step += 1) {
      const nr = row - dr * step;
      const nc = col - dc * step;
      if (!inBounds(state.size, nr, nc) || state.board[nr][nc] !== player) break;
      count += 1;
    }
    if (count >= 5) return true;
  }
  return false;
}

function evaluateMove(state: GameStateBase, row: number, col: number, player: Player): number {
  let score = 0;
  for (const [dr, dc] of DIRS) {
    let line = 0;
    for (let step = 1; step <= 4; step += 1) {
      const nr = row + dr * step;
      const nc = col + dc * step;
      if (!inBounds(state.size, nr, nc)) break;
      if (state.board[nr][nc] === player) line += 1;
      if (state.board[nr][nc] !== "" && state.board[nr][nc] !== player) {
        line -= 1;
        break;
      }
    }
    score += Math.max(0, line);
  }
  const center = (state.size - 1) / 2;
  score += Math.max(0, 3 - Math.abs(row - center) * 0.25 - Math.abs(col - center) * 0.25);
  return score;
}

export const gomokuEngine: GameEngine = {
  id: "gomoku",
  name: "五子棋 Gomoku",
  sizeOptions: [9, 11, 13, 15, 17, 19],
  supportsPuzzle: false,
  canPass: false,
  rules: [
    "棋盤：15x15 或 19x19 為常見尺寸。",
    "輪流在空格落子，先連成五子者勝。",
    "此版本不含禁手規則，簡化對弈。"
  ],
  init(size: number) {
    return {
      size,
      board: createBoard(size),
      turn: "B",
      moves: [],
      lastMove: null,
      gameOver: false,
      winner: null
    };
  },
  isLegal(state, row, col) {
    return inBounds(state.size, row, col) && state.board[row][col] === "" && !state.gameOver;
  },
  applyMove(state, row, col) {
    if (!this.isLegal(state, row, col)) return state;
    const board = state.board.map((r) => [...r]);
    board[row][col] = state.turn;

    const win = checkFive({ ...state, board }, row, col, state.turn);
    return {
      ...state,
      board,
      turn: state.turn === "B" ? "W" : "B",
      lastMove: { row, col },
      moves: [...state.moves, { row, col, player: state.turn }],
      gameOver: win,
      winner: win ? state.turn : null
    };
  },
  aiMove(state, difficulty: AIDifficulty) {
    const options: Array<{ row: number; col: number; score: number }> = [];
    for (let r = 0; r < state.size; r += 1) {
      for (let c = 0; c < state.size; c += 1) {
        if (state.board[r][c] !== "") continue;
        const score = evaluateMove(state, r, c, state.turn);
        options.push({ row: r, col: c, score });
      }
    }
    if (!options.length) return null;

    if (difficulty === "easy") {
      return options[Math.floor(Math.random() * options.length)];
    }

    options.sort((a, b) => b.score - a.score);
    if (difficulty === "hard") return options[0];

    return options[Math.floor(Math.random() * Math.min(4, options.length))];
  }
};
