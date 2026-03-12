import type { GameStateBase, Player } from "../types";

export interface GameRules {
  id: string;
  name: string;
  sizeOptions: number[];
  init: (size?: number) => GameStateBase;
  isLegal: (state: GameStateBase, from: { row: number; col: number } | null, to: { row: number; col: number }) => boolean;
  applyMove: (state: GameStateBase, from: { row: number; col: number } | null, to: { row: number; col: number }) => GameStateBase;
  listMoves: (state: GameStateBase, player: Player) => Array<{ from: { row: number; col: number } | null; to: { row: number; col: number } }>;
  checkWinner: (state: GameStateBase) => Player | "D" | null;
  canPass: boolean;
  rules: string[];
  supportsPuzzle: boolean;
}
