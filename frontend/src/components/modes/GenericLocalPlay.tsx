import React from "react";
import type { GameEngine, GameStateBase } from "../../games/types";
import ResponsiveGridBoard from "../board/ResponsiveGridBoard";
import SaveLoadModal from "../SaveLoadModal";
import { loadSlots, saveToSlots } from "../saveSlots";

interface Props {
  engine: GameEngine;
  size: number;
  state: GameStateBase;
  onStateChange: (state: GameStateBase) => void;
}

const GenericLocalPlay: React.FC<Props> = ({ engine, size, state, onStateChange }) => {
  const [message, setMessage] = React.useState("雙擊確認落子");
  const [loadOpen, setLoadOpen] = React.useState(false);
  const saveKey = `multi-${engine.id}-${size}`;
  const slots = React.useMemo(() => loadSlots(saveKey), [saveKey, loadOpen, state.moves.length]);

  const onPass = () => {
    if (!engine.canPass) return;
    onStateChange({
      ...state,
      turn: state.turn === "B" ? "W" : "B",
      moves: [...state.moves, { row: -1, col: -1, player: state.turn }]
    });
    setMessage("Pass");
  };

  const onReset = () => {
    onStateChange(engine.init(size));
    setMessage("已重設棋局");
  };

  return (
    <section className="mode-panel">
      <h2>本機對戰</h2>
      <p>{message}</p>
      <div className="row-gap">
        <button type="button" onClick={() => saveToSlots(saveKey, `${engine.name} ${size}x${size}`, state)}>
          保存
        </button>
        <button type="button" onClick={() => setLoadOpen(true)}>
          載入
        </button>
      </div>
      <ResponsiveGridBoard engine={engine} state={state} onStateChange={onStateChange} onPass={onPass} onReset={onReset} />

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

export default GenericLocalPlay;
