export type Player = "B" | "W";

export interface MoveRecord {
  row: number;
  col: number;
  player: Player;
}

export interface GameStateBase {
  size: number;
  board: string[][];
  turn: Player;
  moves: MoveRecord[];
  lastMove: { row: number; col: number } | null;
  gameOver: boolean;
  winner: Player | "D" | null;
}

export type AIDifficulty = "easy" | "medium" | "hard";

export interface GameEngine {
  id: string;
  name: string;
  sizeOptions: number[];
  init: (size: number) => GameStateBase;
  isLegal: (state: GameStateBase, row: number, col: number) => boolean;
  applyMove: (state: GameStateBase, row: number, col: number) => GameStateBase;
  aiMove: (state: GameStateBase, difficulty: AIDifficulty) => { row: number; col: number } | null;
  rules: string[];
  supportsPuzzle: boolean;
  canPass: boolean;
}
