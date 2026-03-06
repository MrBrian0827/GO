import React, { useState } from "react";
import Board from "../Board";
import { passTurn, playMove } from "../goLogic";
import type { GameState } from "../goLogic";

interface LocalPlayProps {
  size: number;
  state: GameState;
  onStateChange: (state: GameState) => void;
  stoneTheme: "classic" | "contrast";
}

const LocalPlay: React.FC<LocalPlayProps> = ({ size, state, onStateChange, stoneTheme }) => {
  const [message, setMessage] = useState("雙擊（或連點同一格）確認落子");

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

  return (
    <section className="mode-panel">
      <h2>本地雙人（{size} x {size}）</h2>
      <p>{message}</p>
      <Board state={state} onPlay={onPlay} onPass={onPass} stoneTheme={stoneTheme} />
    </section>
  );
};

export default LocalPlay;
