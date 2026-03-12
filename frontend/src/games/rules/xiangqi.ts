import type { GameRules } from "./types";
import type { GameStateBase, Player } from "../types";

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < 10 && col >= 0 && col < 9;
}

function createBoard(): string[][] {
  const board = Array.from({ length: 10 }, () => Array.from({ length: 9 }, () => ""));
  const top = ["R", "N", "B", "A", "K", "A", "B", "N", "R"];
  const bottom = ["R", "N", "B", "A", "K", "A", "B", "N", "R"];

  top.forEach((p, i) => (board[0][i] = `B${p}`));
  bottom.forEach((p, i) => (board[9][i] = `W${p}`));

  board[2][1] = "BC";
  board[2][7] = "BC";
  board[7][1] = "WC";
  board[7][7] = "WC";

  [0, 2, 4, 6, 8].forEach((c) => {
    board[3][c] = "BP";
    board[6][c] = "WP";
  });

  return board;
}

function pieceAt(board: string[][], row: number, col: number): string {
  return board[row][col];
}

function isSameSide(cell: string, player: Player): boolean {
  return cell !== "" && cell[0] === player;
}

function isEnemy(cell: string, player: Player): boolean {
  return cell !== "" && cell[0] !== player;
}

function addMove(moves: Array<{ from: { row: number; col: number }; to: { row: number; col: number } }>, from: { row: number; col: number }, to: { row: number; col: number }) {
  moves.push({ from, to });
}

function palaceContains(player: Player, row: number, col: number): boolean {
  if (player === "B") return row >= 0 && row <= 2 && col >= 3 && col <= 5;
  return row >= 7 && row <= 9 && col >= 3 && col <= 5;
}

function riverCrossed(player: Player, row: number): boolean {
  return player === "B" ? row >= 5 : row <= 4;
}

function generateMoves(state: GameStateBase, player: Player) {
  const moves: Array<{ from: { row: number; col: number }; to: { row: number; col: number } }> = [];
  for (let r = 0; r < 10; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      const cell = pieceAt(state.board, r, c);
      if (!isSameSide(cell, player)) continue;
      const piece = cell.slice(1);
      const from = { row: r, col: c };

      if (piece === "K") {
        const dirs = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1]
        ];
        for (const [dr, dc] of dirs) {
          const nr = r + dr;
          const nc = c + dc;
          if (!inBounds(nr, nc) || !palaceContains(player, nr, nc)) continue;
          if (isSameSide(pieceAt(state.board, nr, nc), player)) continue;
          addMove(moves, from, { row: nr, col: nc });
        }
      }

      if (piece === "A") {
        const dirs = [
          [1, 1],
          [1, -1],
          [-1, 1],
          [-1, -1]
        ];
        for (const [dr, dc] of dirs) {
          const nr = r + dr;
          const nc = c + dc;
          if (!inBounds(nr, nc) || !palaceContains(player, nr, nc)) continue;
          if (isSameSide(pieceAt(state.board, nr, nc), player)) continue;
          addMove(moves, from, { row: nr, col: nc });
        }
      }

      if (piece === "B") {
        const dirs = [
          [2, 2],
          [2, -2],
          [-2, 2],
          [-2, -2]
        ];
        for (const [dr, dc] of dirs) {
          const nr = r + dr;
          const nc = c + dc;
          const br = r + dr / 2;
          const bc = c + dc / 2;
          if (!inBounds(nr, nc)) continue;
          if (player === "B" && nr > 4) continue;
          if (player === "W" && nr < 5) continue;
          if (pieceAt(state.board, br, bc) !== "") continue;
          if (isSameSide(pieceAt(state.board, nr, nc), player)) continue;
          addMove(moves, from, { row: nr, col: nc });
        }
      }

      if (piece === "N") {
        const jumps = [
          [2, 1, 1, 0],
          [2, -1, 1, 0],
          [-2, 1, -1, 0],
          [-2, -1, -1, 0],
          [1, 2, 0, 1],
          [1, -2, 0, -1],
          [-1, 2, 0, 1],
          [-1, -2, 0, -1]
        ];
        for (const [dr, dc, lr, lc] of jumps) {
          const legRow = r + lr;
          const legCol = c + lc;
          const nr = r + dr;
          const nc = c + dc;
          if (!inBounds(nr, nc)) continue;
          if (pieceAt(state.board, legRow, legCol) !== "") continue;
          if (isSameSide(pieceAt(state.board, nr, nc), player)) continue;
          addMove(moves, from, { row: nr, col: nc });
        }
      }

      if (piece === "R") {
        const dirs = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1]
        ];
        for (const [dr, dc] of dirs) {
          let nr = r + dr;
          let nc = c + dc;
          while (inBounds(nr, nc)) {
            const target = pieceAt(state.board, nr, nc);
            if (target === "") {
              addMove(moves, from, { row: nr, col: nc });
            } else {
              if (isEnemy(target, player)) addMove(moves, from, { row: nr, col: nc });
              break;
            }
            nr += dr;
            nc += dc;
          }
        }
      }

      if (piece === "C") {
        const dirs = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1]
        ];
        for (const [dr, dc] of dirs) {
          let nr = r + dr;
          let nc = c + dc;
          let jumped = false;
          while (inBounds(nr, nc)) {
            const target = pieceAt(state.board, nr, nc);
            if (!jumped) {
              if (target === "") {
                addMove(moves, from, { row: nr, col: nc });
              } else {
                jumped = true;
              }
            } else {
              if (target !== "") {
                if (isEnemy(target, player)) addMove(moves, from, { row: nr, col: nc });
                break;
              }
            }
            nr += dr;
            nc += dc;
          }
        }
      }

      if (piece === "P") {
        const forward = player === "B" ? 1 : -1;
        const nr = r + forward;
        if (inBounds(nr, c) && !isSameSide(pieceAt(state.board, nr, c), player)) {
          addMove(moves, from, { row: nr, col: c });
        }
        if (riverCrossed(player, r)) {
          const sideCols = [c - 1, c + 1];
          for (const nc of sideCols) {
            if (inBounds(r, nc) && !isSameSide(pieceAt(state.board, r, nc), player)) {
              addMove(moves, from, { row: r, col: nc });
            }
          }
        }
      }
    }
  }

  return moves;
}

function cloneState(state: GameStateBase): GameStateBase {
  return {
    ...state,
    board: state.board.map((r) => [...r])
  };
}

function apply(state: GameStateBase, from: { row: number; col: number }, to: { row: number; col: number }): GameStateBase {
  const next = cloneState(state);
  next.board[to.row][to.col] = next.board[from.row][from.col];
  next.board[from.row][from.col] = "";
  next.turn = state.turn === "B" ? "W" : "B";
  next.lastMove = { row: to.row, col: to.col };
  next.moves = [...state.moves, { row: to.row, col: to.col, player: state.turn }];
  return next;
}

function locateKing(board: string[][], player: Player): { row: number; col: number } | null {
  for (let r = 0; r < 10; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      if (board[r][c] === `${player}K`) return { row: r, col: c };
    }
  }
  return null;
}

export const xiangqiRules: GameRules = {
  id: "xiangqi",
  name: "中國象棋",
  sizeOptions: [10],
  supportsPuzzle: true,
  canPass: false,
  rules: [
    "棋盤 9x10，黑先白後。",
    "將/帥只能在九宮內移動。",
    "象不過河、馬走日、炮隔子吃子。",
    "先吃掉對方將/帥者勝。"
  ],
  init() {
    return {
      size: 10,
      board: createBoard(),
      turn: "B",
      moves: [],
      lastMove: null,
      gameOver: false,
      winner: null
    };
  },
  isLegal(state, from, to) {
    if (!from) return false;
    const moves = generateMoves(state, state.turn);
    return moves.some((m) => m.from.row === from.row && m.from.col === from.col && m.to.row === to.row && m.to.col === to.col);
  },
  applyMove(state, from, to) {
    if (!from || !this.isLegal(state, from, to)) return state;
    const next = apply(state, from, to);
    const winner = this.checkWinner(next);
    return { ...next, gameOver: !!winner, winner };
  },
  listMoves(state, player) {
    return generateMoves(state, player).map((m) => ({ from: m.from, to: m.to }));
  },
  checkWinner(state) {
    const blackKing = locateKing(state.board, "B");
    const whiteKing = locateKing(state.board, "W");
    if (!blackKing) return "W";
    if (!whiteKing) return "B";
    return null;
  }
};
