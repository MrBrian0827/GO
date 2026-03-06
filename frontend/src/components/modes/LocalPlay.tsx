import React, { useState } from "react";
import Board from "../Board";
import { createInitialState, passTurn, playMove, undoLastMove } from "../goLogic";
import type { GameState } from "../goLogic";

interface LocalPlayProps {
  size: number;
  state: GameState;
  onStateChange: (state: GameState) => void;
  stoneTheme: "classic" | "contrast";
}

const LocalPlay: React.FC<LocalPlayProps> = ({ size, state, onStateChange, stoneTheme }) => {
  const [message, setMessage] = useState("雙擊（或連點同一格）確認落子");

  const saveKey = `go-local-${size}`;

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
    const ok = window.confirm("確認重設本地棋局？");
    if (!ok) return;
    onStateChange(createInitialState(size));
    setMessage("棋局已重設");
  };

  const onSave = () => {
    localStorage.setItem(saveKey, JSON.stringify(state));
    setMessage("已保存本地棋局");
  };

  const onLoad = () => {
    const raw = localStorage.getItem(saveKey);
    if (!raw) {
      setMessage("沒有可載入的棋局");
      return;
    }

    try {
      const parsed = JSON.parse(raw) as GameState;
      if (!parsed || parsed.size !== size || !Array.isArray(parsed.board)) {
        setMessage("保存檔格式不符目前棋盤大小");
        return;
      }
      onStateChange(parsed);
      setMessage("已載入本地棋局");
    } catch {
      setMessage("載入失敗，保存資料損壞");
    }
  };

  return (
    <section className="mode-panel">
      <h2>本地雙人（{size} x {size}）</h2>
      <p>{message}</p>
      <div className="row-gap">
        <button type="button" onClick={onUndo}>
          Undo
        </button>
        <button type="button" onClick={onReset}>
          Reset
        </button>
        <button type="button" onClick={onSave}>
          保存
        </button>
        <button type="button" onClick={onLoad}>
          載入
        </button>
      </div>
      <Board state={state} onPlay={onPlay} onPass={onPass} stoneTheme={stoneTheme} />
    </section>
  );
};

export default LocalPlay;
