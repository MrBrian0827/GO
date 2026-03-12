import type { GameEngine, GameStateBase, Player, AIDifficulty } from "./types";

function inBounds(size: number, row: number, col: number): boolean {
  return row >= 0 && row < size && col >= 0 && col < size;
}

function buildBoard(size: number, rows: string[][]): string[][] {
  const board = Array.from({ length: size }, () => Array.from({ length: rows[0].length }, () => ""));
  rows.forEach((r, i) => r.forEach((cell, j) => (board[i][j] = cell)));
  return board;
}

function cloneBoard(board: string[][]): string[][] {
  return board.map((r) => [...r]);
}

function simpleMove(state: GameStateBase, row: number, col: number, targetRow: number, targetCol: number): GameStateBase {
  const board = cloneBoard(state.board);
  board[targetRow][targetCol] = board[row][col];
  board[row][col] = "";
  return {
    ...state,
    board,
    turn: state.turn === "B" ? "W" : "B",
    lastMove: { row: targetRow, col: targetCol },
    moves: [...state.moves, { row: targetRow, col: targetCol, player: state.turn }]
  };
}

function basicAi(state: GameStateBase): { row: number; col: number } | null {
  const moves: Array<{ row: number; col: number }> = [];
  for (let r = 0; r < state.size; r += 1) {
    for (let c = 0; c < state.board[r].length; c += 1) {
      if (state.board[r][c] === "") continue;
      const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ];
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (!inBounds(state.size, nr, nc)) continue;
        if (state.board[nr][nc] === "" || state.board[nr][nc][0] !== state.turn) {
          moves.push({ row: nr, col: nc });
        }
      }
    }
  }
  if (!moves.length) return null;
  return moves[Math.floor(Math.random() * moves.length)];
}

export const xiangqiEngine: GameEngine = {
  id: "xiangqi",
  name: "中國象棋 Xiangqi",
  sizeOptions: [10],
  supportsPuzzle: true,
  canPass: false,
  rules: [
    "棋盤 9x10，本版本為簡化規則示範。",
    "棋子用字母表示：B/W 代表陣營。",
    "目前僅支援基本走子與吃子，後續可替換引擎。"
  ],
  init() {
    const rows = [
      ["BR", "BN", "BB", "BA", "BK", "BA", "BB", "BN", "BR"],
      ["", "", "", "", "", "", "", "", ""],
      ["", "BC", "", "", "", "", "", "BC", ""],
      ["BP", "", "BP", "", "BP", "", "BP", "", "BP"],
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", ""],
      ["WP", "", "WP", "", "WP", "", "WP", "", "WP"],
      ["", "WC", "", "", "", "", "", "WC", ""],
      ["", "", "", "", "", "", "", "", ""],
      ["WR", "WN", "WB", "WA", "WK", "WA", "WB", "WN", "WR"]
    ];
    return {
      size: 10,
      board: buildBoard(10, rows),
      turn: "B",
      moves: [],
      lastMove: null,
      gameOver: false,
      winner: null
    };
  },
  isLegal(state, row, col) {
    return inBounds(state.size, row, col) && state.board[row][col] !== "";
  },
  applyMove(state, row, col) {
    if (!this.isLegal(state, row, col)) return state;
    return simpleMove(state, row, col, row, col);
  },
  aiMove(state, _difficulty: AIDifficulty) {
    return basicAi(state);
  }
};

export const shogiEngine: GameEngine = {
  id: "shogi",
  name: "日本將棋 Shogi",
  sizeOptions: [9],
  supportsPuzzle: true,
  canPass: false,
  rules: [
    "棋盤 9x9，本版本為簡化規則示範。",
    "棋子用字母表示：B/W 代表陣營。",
    "目前僅支援基本走子與吃子，後續可替換引擎。"
  ],
  init() {
    const rows = [
      ["BR", "BN", "BS", "BG", "BK", "BG", "BS", "BN", "BR"],
      ["", "BB", "", "", "", "", "", "BR", ""],
      ["BP", "BP", "BP", "BP", "BP", "BP", "BP", "BP", "BP"],
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", ""],
      ["WP", "WP", "WP", "WP", "WP", "WP", "WP", "WP", "WP"],
      ["", "WR", "", "", "", "", "", "WB", ""],
      ["WR", "WN", "WS", "WG", "WK", "WG", "WS", "WN", "WR"]
    ];
    return {
      size: 9,
      board: buildBoard(9, rows),
      turn: "B",
      moves: [],
      lastMove: null,
      gameOver: false,
      winner: null
    };
  },
  isLegal(state, row, col) {
    return inBounds(state.size, row, col) && state.board[row][col] !== "";
  },
  applyMove(state, row, col) {
    if (!this.isLegal(state, row, col)) return state;
    return simpleMove(state, row, col, row, col);
  },
  aiMove(state) {
    return basicAi(state);
  }
};

export const darkChessEngine: GameEngine = {
  id: "darkchess",
  name: "暗棋 Dark Chess",
  sizeOptions: [8],
  supportsPuzzle: false,
  canPass: true,
  rules: [
    "棋盤 4x8，本版本為簡化規則示範。",
    "可先翻開未知棋子，再移動一格或吃子。",
    "目前僅提供基礎隨機 AI。"
  ],
  init() {
    const board = Array.from({ length: 8 }, () => Array.from({ length: 4 }, () => "?"));
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
    return inBounds(state.size, row, col);
  },
  applyMove(state, row, col) {
    if (!this.isLegal(state, row, col)) return state;
    const board = cloneBoard(state.board);
    if (board[row][col] === "?") {
      board[row][col] = state.turn === "B" ? "BP" : "WP";
      return {
        ...state,
        board,
        turn: state.turn === "B" ? "W" : "B",
        lastMove: { row, col },
        moves: [...state.moves, { row, col, player: state.turn }]
      };
    }
    return simpleMove(state, row, col, row, col);
  },
  aiMove(state) {
    const moves: Array<{ row: number; col: number }> = [];
    for (let r = 0; r < state.size; r += 1) {
      for (let c = 0; c < state.board[r].length; c += 1) {
        moves.push({ row: r, col: c });
      }
    }
    if (!moves.length) return null;
    return moves[Math.floor(Math.random() * moves.length)];
  }
};
