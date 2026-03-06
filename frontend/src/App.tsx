import React, { useState } from "react";
import Tutorial from "./components/Tutorial";
import LocalPlay from "./components/modes/LocalPlay";
import AIPlay from "./components/modes/AIPlay";
import { createInitialState } from "./components/goLogic";
import type { GameState } from "./components/goLogic";
import "./styles/board.css";

type ModeKey = "local" | "ai" | "tutorial";

const BOARD_SIZES = [5, 6, 7, 8, 9, 11, 13, 15, 17, 19];

const modeList: Array<{ key: ModeKey; label: string; badge: string }> = [
  { key: "local", label: "本地雙人", badge: "LOCAL" },
  { key: "ai", label: "對 AI", badge: "AI" },
  { key: "tutorial", label: "教學", badge: "LEARN" }
];

function hasUnfinishedMoves(state: GameState): boolean {
  return state.moves.length > 0 && !state.gameOver;
}

const App: React.FC = () => {
  const [mode, setMode] = useState<ModeKey>("local");
  const [localSize, setLocalSize] = useState(9);
  const [aiSize, setAiSize] = useState(9);
  const [localState, setLocalState] = useState<GameState>(createInitialState(9));
  const [aiState, setAiState] = useState<GameState>(createInitialState(9));
  const [stoneTheme, setStoneTheme] = useState<"classic" | "contrast">("classic");
  const [notice, setNotice] = useState("已啟用雙擊確認落子，降低誤觸。");

  const trySwitchMode = (next: ModeKey) => {
    if (next === mode) return;

    if ((mode === "local" && hasUnfinishedMoves(localState)) || (mode === "ai" && hasUnfinishedMoves(aiState))) {
      const ok = window.confirm("目前棋局尚未結束，是否切換模式？系統會自動保留進度。");
      if (!ok) return;
      setNotice("已保留目前棋局進度。");
    }

    setMode(next);
  };

  const handleSizeChange = (next: number) => {
    if (mode === "local") {
      if (hasUnfinishedMoves(localState)) {
        const save = window.confirm("切換棋盤大小會重設目前本地棋局。是否先保存進度？");
        if (save) localStorage.setItem(`go-local-slots-${localSize}`, JSON.stringify(localState));
      }
      setLocalSize(next);
      setLocalState(createInitialState(next));
      setNotice(`已切換本地對局棋盤尺寸為 ${next}x${next}。`);
      return;
    }

    if (mode === "ai") {
      if (hasUnfinishedMoves(aiState)) {
        const save = window.confirm("切換棋盤大小會重設目前 AI 棋局。是否先保存進度？");
        if (save) localStorage.setItem(`go-ai-slots-${aiSize}-medium`, JSON.stringify(aiState));
      }
      setAiSize(next);
      setAiState(createInitialState(next));
      setNotice(`已切換 AI 對局棋盤尺寸為 ${next}x${next}。`);
    }
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>GO - 線上圍棋學習與對弈平台</h1>
        <p>{notice}</p>
      </header>

      <section className="mode-tabs" aria-label="mode-tabs">
        {modeList.map((m) => (
          <button
            key={m.key}
            type="button"
            className={`mode-tab ${mode === m.key ? "active" : ""}`}
            onClick={() => trySwitchMode(m.key)}
          >
            <span className="badge">{m.badge}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </section>

      <section className="control-bar">
        {(mode === "local" || mode === "ai") && (
          <label htmlFor="board-size" className="field-row">
            棋盤大小
            <select
              id="board-size"
              value={mode === "local" ? localSize : aiSize}
              onChange={(e) => handleSizeChange(Number(e.target.value))}
            >
              {BOARD_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s} x {s}
                </option>
              ))}
            </select>
          </label>
        )}

        <label htmlFor="stone-theme" className="field-row">
          棋子風格
          <select
            id="stone-theme"
            value={stoneTheme}
            onChange={(e) => setStoneTheme(e.target.value as "classic" | "contrast")}
          >
            <option value="classic">經典黑白</option>
            <option value="contrast">高對比</option>
          </select>
        </label>

        <details className="resource-menu">
          <summary>學習資源</summary>
          <div className="resource-list">
            <a href="https://www.youtube.com/results?search_query=潘潘圍棋教學" target="_blank" rel="noreferrer">
              推薦圍棋教學 YT
            </a>
            <a href="https://goproblems.com/" target="_blank" rel="noreferrer">
              開源題庫學習
            </a>
            <a href="https://www.cosumi.net/en/" target="_blank" rel="noreferrer">
              功能參考來源
            </a>
          </div>
        </details>
      </section>

      {mode === "local" && (
        <LocalPlay size={localSize} state={localState} onStateChange={setLocalState} stoneTheme={stoneTheme} />
      )}
      {mode === "ai" && <AIPlay size={aiSize} state={aiState} onStateChange={setAiState} stoneTheme={stoneTheme} />}
      {mode === "tutorial" && <Tutorial />}
    </main>
  );
};

export default App;
