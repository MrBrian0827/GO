import type { GameEngine } from "./types";
import type { GameRules } from "./rules/types";
import { MinimaxEngine, MonteCarloEngine, ExternalEngineAdapter } from "./engines/aiEngines";
import type { AIDifficulty, GameStateBase } from "./types";

export function createEngineFromRules(rules: GameRules): GameEngine {
  return {
    id: rules.id,
    name: rules.name,
    sizeOptions: rules.sizeOptions,
    supportsPuzzle: rules.supportsPuzzle,
    canPass: rules.canPass,
    rules: rules.rules,
    init: (size?: number) => rules.init(size),
    isLegal: (state, row, col) => rules.isLegal(state, { row, col }, { row, col }),
    applyMove: (state, row, col) => rules.applyMove(state, { row, col }, { row, col }),
    aiMove: (state: GameStateBase, difficulty: AIDifficulty) => {
      const engine = difficulty === "hard" ? MonteCarloEngine : difficulty === "medium" ? MinimaxEngine : ExternalEngineAdapter;
      const move = engine.chooseMove(rules, state, difficulty);
      if (!move) return null;
      return { row: move.to.row, col: move.to.col };
    }
  };
}
