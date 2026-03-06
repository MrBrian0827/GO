import React, { useEffect, useRef, useState } from "react";
import Board from "../Board";
import { chooseAIMove } from "../AIPlayer";
import { passTurn, playMove } from "../goLogic";
import type { GameState } from "../goLogic";

interface AIPlayProps {
  size: number;
  state: GameState;
  onStateChange: (state: GameState) => void;
  stoneTheme: "classic" | "contrast";
}

const AIPlay: React.FC<AIPlayProps> = ({ size, state, onStateChange, stoneTheme }) => {
  const [message, setMessage] = useState("你執黑，AI 執白");
  const [aiThinking, setAiThinking] = useState(false);
  const aiTimer = useRef<number | null>(null);

  useEffect(() => {
    if (state.gameOver || state.turn !== "W") return;

    setAiThinking(true);
    aiTimer.current = window.setTimeout(() => {
      const aiMove = chooseAIMove(state, "W");
      if (!aiMove) {
        onStateChange(passTurn(state));
        setMessage("AI Pass");
        setAiThinking(false);
        return;
      }

      const result = playMove(state, aiMove.row, aiMove.col);
      if (result.ok) {
        onStateChange(result.state);
        setMessage("AI 已回應");
      }
      setAiThinking(false);
    }, 360);

    return () => {
      if (aiTimer.current) window.clearTimeout(aiTimer.current);
    };
  }, [state, onStateChange]);

  const onPlay = (row: number, col: number) => {
    if (state.turn !== "B" || aiThinking) {
      setMessage("請等待 AI 行動完成");
      return;
    }

    const result = playMove(state, row, col);
    if (!result.ok) {
      setMessage(result.message ?? "不合法手");
      return;
    }

    onStateChange(result.state);
    setMessage("你已落子，AI 思考中...");
  };

  const onPass = () => {
    if (state.turn !== "B" || aiThinking) return;
    onStateChange(passTurn(state));
    setMessage("你選擇 Pass");
  };

  return (
    <section className="mode-panel">
      <h2>對 AI（{size} x {size}）</h2>
      <p>{message}</p>
      <Board state={state} onPlay={onPlay} onPass={onPass} stoneTheme={stoneTheme} />
    </section>
  );
};

export default AIPlay;
