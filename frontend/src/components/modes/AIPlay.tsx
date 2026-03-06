import React, { useEffect, useMemo, useRef, useState } from "react";
import Board from "../Board";
import SaveLoadModal from "../SaveLoadModal";
import { chooseAIMove } from "../AIPlayer";
import type { AIDifficulty } from "../AIPlayer";
import { createInitialState, passTurn, playMove, replayMoves, undoLastMove } from "../goLogic";
import type { GameState } from "../goLogic";
import { loadSlots, saveToSlots } from "../saveSlots";

interface AIPlayProps {
  size: number;
  state: GameState;
  onStateChange: (state: GameState) => void;
  stoneTheme: "classic" | "contrast";
}

const AIPlay: React.FC<AIPlayProps> = ({ size, state, onStateChange, stoneTheme }) => {
  const [difficulty, setDifficulty] = useState<AIDifficulty>("medium");
  const [message, setMessage] = useState("你執黑，AI 執白");
  const [aiThinking, setAiThinking] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  const aiTimer = useRef<number | null>(null);

  const saveKey = `go-ai-slots-${size}-${difficulty}`;
  const slots = useMemo(() => loadSlots(saveKey), [saveKey, loadOpen, state.moveNumber]);

  useEffect(() => {
    if (state.gameOver || state.turn !== "W") return;

    setAiThinking(true);
    aiTimer.current = window.setTimeout(() => {
      const aiMove = chooseAIMove(state, "W", difficulty);
      if (!aiMove) {
        onStateChange(passTurn(state));
        setMessage("AI 選擇 Pass");
        setAiThinking(false);
        return;
      }

      const result = playMove(state, aiMove.row, aiMove.col);
      if (result.ok) {
        onStateChange(result.state);
        setMessage(`AI 已回應（${difficulty}）`);
      }
      setAiThinking(false);
    }, 320);

    return () => {
      if (aiTimer.current) window.clearTimeout(aiTimer.current);
    };
  }, [state, onStateChange, difficulty]);

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

  const onUndo = () => {
    if (!state.moves.length || aiThinking) {
      setMessage("目前無法悔棋");
      return;
    }

    let next = undoLastMove(state, 1);
    if (next.turn !== "B" && next.moves.length) {
      next = undoLastMove(next, 1);
    }

    onStateChange(replayMoves(next.size, next.moves));
    setMessage("已回退到玩家回合");
  };

  const onReset = () => {
    const ok = window.confirm("確認重新開始 AI 對局？");
    if (!ok) return;
    onStateChange(createInitialState(size));
    setMessage("AI 棋局已重設");
  };

  const onSave = () => {
    saveToSlots(saveKey, `AI對局 ${difficulty} ${size}x${size}`, state);
    setMessage("已保存存檔（最多 3 筆）");
  };

  return (
    <section className="mode-panel">
      <h2>對 AI（{size} x {size}）</h2>
      <p>{message}</p>

      <div className="row-gap">
        <label htmlFor="ai-difficulty" className="field-row">
          AI 難度
          <select
            id="ai-difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as AIDifficulty)}
            disabled={aiThinking}
          >
            <option value="easy">簡單（隨機合法）</option>
            <option value="medium">中等（棋形評估）</option>
            <option value="hard">困難（攻防預判）</option>
          </select>
        </label>
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
          setMessage("已載入 AI 存檔");
        }}
      />
    </section>
  );
};

export default AIPlay;
