import React, { useState } from "react";
import LocalPlay from "./components/modes/LocalPlay";
import AIPlay from "./components/modes/AIPlay";
import Tutorial from "./components/Tutorial";
import Puzzle from "./components/Puzzle";
import { createInitialState } from "./components/goLogic";
import type { GameState } from "./components/goLogic";
import "./styles/board.css";

type TabKey = "rules" | "local" | "ai" | "tutorial" | "puzzle" | "pvp";

const BOARD_SIZES = [5, 6, 7, 8, 9, 11, 13, 15, 17, 19];

const App: React.FC = () => {
  const [tab, setTab] = useState<TabKey>("local");
  const [size, setSize] = useState(19);
  const [localState, setLocalState] = useState<GameState>(createInitialState(19));
  const [aiState, setAiState] = useState<GameState>(createInitialState(19));
  const [stoneTheme, setStoneTheme] = useState<"classic" | "contrast">("classic");

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>GO - 線上圍棋學習與對弈平台</h1>
        <p>支援本機對戰、AI 對戰、教學與題庫。</p>
        <details className="resource-menu">
          <summary>推薦資源</summary>
          <div className="resource-list">
            <a href="https://www.youtube.com/@%E6%BD%98%E6%BD%98%E5%9C%8D%E6%A3%8B" target="_blank" rel="noreferrer">
              推薦圍棋教學 YT
            </a>
            <a href="https://www.goproblems.com/" target="_blank" rel="noreferrer">
              開源題庫學習
            </a>
            <a href="https://www.cosumi.net/en/" target="_blank" rel="noreferrer">
              功能參考來源
            </a>
          </div>
        </details>
      </header>

      <div className="tab-bar">
        {["rules", "local", "ai", "tutorial", "puzzle", "pvp"].map((t) => (
          <button key={t} type="button" className={tab === t ? "active" : ""} onClick={() => setTab(t as TabKey)}>
            {t === "rules" && "規則"}
            {t === "local" && "本機對戰"}
            {t === "ai" && "AI 對戰"}
            {t === "tutorial" && "教學"}
            {t === "puzzle" && "題庫"}
            {t === "pvp" && "連線對戰"}
          </button>
        ))}
      </div>

      {(tab === "local" || tab === "ai") && (
        <section className="control-bar">
          <label htmlFor="go-size" className="field-row">
            棋盤大小
            <select
              id="go-size"
              value={size}
              onChange={(e) => {
                const next = Number(e.target.value);
                setSize(next);
                setLocalState(createInitialState(next));
                setAiState(createInitialState(next));
              }}
            >
              {BOARD_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s} x {s}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="stone-theme" className="field-row">
            棋子風格
            <select id="stone-theme" value={stoneTheme} onChange={(e) => setStoneTheme(e.target.value as any)}>
              <option value="classic">經典黑白</option>
              <option value="contrast">高對比</option>
            </select>
          </label>
        </section>
      )}

      {tab === "rules" && (
        <section className="mode-panel">
          <h2>圍棋規則簡介</h2>
          <ul>
            <li>棋盤常見 19x19，黑先白後。</li>
            <li>棋子無移動，落子後透過提子吃棋。</li>
            <li>禁止自殺與簡單 Ko。</li>
            <li>雙方連續 Pass 即終局。</li>
          </ul>
        </section>
      )}

      {tab === "local" && <LocalPlay size={size} state={localState} onStateChange={setLocalState} stoneTheme={stoneTheme} />}
      {tab === "ai" && <AIPlay size={size} state={aiState} onStateChange={setAiState} stoneTheme={stoneTheme} />}
      {tab === "tutorial" && <Tutorial />}
      {tab === "puzzle" && <Puzzle />}

      {tab === "pvp" && (
        <section className="mode-panel">
          <h2>連線對戰</h2>
          <p>此功能需要密碼驗證，後續接入 `/api/auth` 與 WebSocket。</p>
          <input placeholder="輸入密碼" type="password" />
          <button type="button">驗證並進入</button>
        </section>
      )}
    </main>
  );
};

export default App;
