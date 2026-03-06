import React, { useMemo, useState } from "react";
import Board from "../Board";
import SaveLoadModal from "../SaveLoadModal";
import { createInitialState, passTurn, playMove, undoLastMove } from "../goLogic";
import type { GameState } from "../goLogic";
import { loadSlots, saveToSlots } from "../saveSlots";

interface LocalPlayProps {
  size: number;
  state: GameState;
  onStateChange: (state: GameState) => void;
  stoneTheme: "classic" | "contrast";
}

const LocalPlay: React.FC<LocalPlayProps> = ({ size, state, onStateChange, stoneTheme }) => {
  const [message, setMessage] = useState("雙擊（或連點同一格）確認落子");
  const [loadOpen, setLoadOpen] = useState(false);

  const saveKey = `go-local-slots-${size}`;
  const slots = useMemo(() => loadSlots(saveKey), [saveKey, loadOpen, state.moveNumber]);

  const onPlay = (row: number, col: number) => {
    const result = playMove(state, row, col);
    if (!result.ok) {
      setMessage(result.message ?? "不合法手");
      return;
    }
    onStateChange(result.state);
    setMessage("落子成功");
  };

  const onPass = () => {
    onStateChange(passTurn(state));
    setMessage("Pass");
  };

  const onUndo = () => {
    if (!state.moves.length) {
      setMessage("目前沒有可悔棋步數");
      return;
    }
    onStateChange(undoLastMove(state, 1));
    setMessage("已悔棋一步");
  };

  const onReset = () => {
    const ok = window.confirm("確認重新開始本地棋局？");
    if (!ok) return;
    onStateChange(createInitialState(size));
    setMessage("棋局已重設");
  };

  const onSave = () => {
    saveToSlots(saveKey, `本地對局 ${size}x${size}`, state);
    setMessage("已保存存檔（最多 3 筆）");
  };

  return (
    <section className="mode-panel">
      <h2>本地雙人（{size} x {size}）</h2>
      <p>{message}</p>
      <div className="row-gap">
        <button type="button" onClick={onUndo}>
          Undo
        </button>
        <button type="button" onClick={onSave}>
          保存
        </button>
        <button type="button" onClick={() => setLoadOpen(true)}>
          載入
        </button>
      </div>
      <Board state={state} onPlay={onPlay} onPass={onPass} onReset={onReset} stoneTheme={stoneTheme} />

      <SaveLoadModal
        open={loadOpen}
        slots={slots}
        onClose={() => setLoadOpen(false)}
        onSelect={(slot) => {
          onStateChange({
            ...createInitialState(slot.state.size),
            ...slot.state
          });
          setLoadOpen(false);
          setMessage("已載入存檔");
        }}
      />
    </section>
  );
};

export default LocalPlay;
