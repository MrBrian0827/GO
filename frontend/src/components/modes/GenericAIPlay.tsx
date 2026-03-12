import React from "react";
import type { GameEngine, GameStateBase, AIDifficulty } from "../../games/types";
import ResponsiveGridBoard from "../board/ResponsiveGridBoard";
import SaveLoadModal from "../SaveLoadModal";
import { loadSlots, saveToSlots } from "../saveSlots";

interface Props {
  engine: GameEngine;
  size: number;
  state: GameStateBase;
  onStateChange: (state: GameStateBase) => void;
}

const GenericAIPlay: React.FC<Props> = ({ engine, size, state, onStateChange }) => {
  const [difficulty, setDifficulty] = React.useState<AIDifficulty>("medium");
  const [message, setMessage] = React.useState("你執黑，AI 執白");
  const [loadOpen, setLoadOpen] = React.useState(false);
  const saveKey = `multi-ai-${engine.id}-${size}-${difficulty}`;
  const slots = React.useMemo(() => loadSlots(saveKey), [saveKey, loadOpen, state.moves.length]);

  React.useEffect(() => {
    if (state.gameOver || state.turn !== "W") return;
    const move = engine.aiMove(state, difficulty);
    if (!move) {
      onStateChange({ ...state, turn: "B" });
      setMessage("AI Pass");
      return;
    }
    onStateChange(engine.applyMove(state, move.row, move.col));
    setMessage(`AI 已回應（${difficulty}）`);
  }, [state, engine, difficulty, onStateChange]);

  return (
    <section className="mode-panel">
      <h2>對 AI</h2>
      <p>{message}</p>
      <div className="row-gap">
        <label htmlFor="generic-ai" className="field-row">
          AI 難度
          <select id="generic-ai" value={difficulty} onChange={(e) => setDifficulty(e.target.value as AIDifficulty)}>
            <option value="easy">簡易</option>
            <option value="medium">困難</option>
            <option value="hard">專家</option>
          </select>
        </label>
        <button type="button" onClick={() => saveToSlots(saveKey, `${engine.name} AI ${size}x${size}`, state)}>
          保存
        </button>
        <button type="button" onClick={() => setLoadOpen(true)}>
          載入
        </button>
      </div>
      <ResponsiveGridBoard engine={engine} state={state} onStateChange={onStateChange} />

      <SaveLoadModal
        open={loadOpen}
        slots={slots}
        onClose={() => setLoadOpen(false)}
        onSelect={(slot) => {
          onStateChange({ ...(engine.init(size) as GameStateBase), ...(slot.state as GameStateBase) });
          setLoadOpen(false);
        }}
      />
    </section>
  );
};

export default GenericAIPlay;
