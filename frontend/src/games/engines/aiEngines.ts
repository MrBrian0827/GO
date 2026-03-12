import type { GameStateBase, Player, AIDifficulty } from "../types";
import type { GameRules } from "../rules/types";

export interface AIEngine {
  id: string;
  name: string;
  chooseMove: (rules: GameRules, state: GameStateBase, difficulty: AIDifficulty) => { from: { row: number; col: number } | null; to: { row: number; col: number } } | null;
}

export const MinimaxEngine: AIEngine = {
  id: "minimax",
  name: "MinimaxEngine",
  chooseMove(rules, state, difficulty) {
    const moves = rules.listMoves(state, state.turn);
    if (!moves.length) return null;

    if (difficulty === "easy") {
      return moves[Math.floor(Math.random() * moves.length)];
    }

    return moves[0];
  }
};

export const MonteCarloEngine: AIEngine = {
  id: "mcts",
  name: "MonteCarloEngine",
  chooseMove(rules, state) {
    const moves = rules.listMoves(state, state.turn);
    if (!moves.length) return null;
    return moves[Math.floor(Math.random() * moves.length)];
  }
};

export const ExternalEngineAdapter: AIEngine = {
  id: "external",
  name: "ExternalEngineAdapter",
  chooseMove() {
    return null;
  }
};
