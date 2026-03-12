import React, { useEffect, useMemo, useRef, useState } from "react";
import Board from "../Board";
import SaveLoadModal from "../SaveLoadModal";
import { createInitialState, passTurn, playMove } from "../goLogic";
import type { GameState } from "../goLogic";
import { loadSlots, saveToSlots } from "../saveSlots";

interface AIPlayProps {
  size: number;
  state: GameState;
  onStateChange: (state: GameState) => void;
  stoneTheme: "classic" | "contrast";
}

const AIPlay: React.FC<AIPlayProps> = ({ size, state, onStateChange, stoneTheme }) => {
  const [message, setMessage] = useState("你執黑，AI 執白");
  const [aiThinking, setAiThinking] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  const aiTimer = useRef<number | null>(null);

  const saveKey = `go-ai-slots-${size}`;
  const slots = useMemo(() => loadSlots(saveKey), [saveKey, loadOpen, state.moveNumber]);

  useEffect(() => {
    if (state.gameOver || state.turn !== "W") return;

    let cancelled = false;
    setAiThinking(true);
    setMessage("AI 思考中...");

    const run = async () => {
      try {
        const res = await fetch("/api/ai/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ size: state.size, moves: state.moves, toPlay: "W" })
        });

        if (!res.ok) throw new Error("AI 引擎回應失敗");
        const data = await res.json();
        if (cancelled) return;

        if (data.move?.pass) {
          onStateChange(passTurn(state));
          setMessage("AI 選擇 Pass");
          return;
        }

        if (typeof data.move?.row === "number" && typeof data.move?.col === "number") {
          const result = playMove(state, data.move.row, data.move.col);
          if (result.ok) {
            onStateChange(result.state);
            setMessage("AI 已回應");
          } else {
            setMessage(result.message ?? "AI 落子失敗");
          }
          return;
        }

        setMessage("AI 回傳格式錯誤");
      } catch (error) {
        if (!cancelled) setMessage("AI 引擎連線失敗");
      } finally {
        if (!cancelled) setAiThinking(false);
      }
    };

    aiTimer.current = window.setTimeout(() => {
      run();
    }, 320);

    return () => {
      cancelled = true;
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

  const onReset = () => {
    const ok = window.confirm("確認重新開始 AI 對局？");
    if (!ok) return;
    onStateChange(createInitialState(size));
    setMessage("AI 棋局已重設");
  };

  const onSave = () => {
    saveToSlots(saveKey, `圍棋AI ${size}x${size}`, state);
    setMessage("已保存存檔（最多 3 筆）");
  };

  return (
    <section className="mode-panel">
      <h2>對 AI（{size} x {size}）</h2>
      <p>{message}</p>

      <div className="row-gap">
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
          onStateChange({ ...(createInitialState(size) as GameState), ...(slot.state as GameState) });
          setLoadOpen(false);
          setMessage("已載入 AI 存檔");
        }}
      />
    </section>
  );
};

export default AIPlay;
