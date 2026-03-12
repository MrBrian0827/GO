import React, { useMemo, useState } from "react";
import { gameList } from "../games/registry";
import type { GameEngine, GameStateBase } from "../games/types";
import GenericLocalPlay from "../components/modes/GenericLocalPlay";
import GenericAIPlay from "../components/modes/GenericAIPlay";
import GoPage from "./GoPage";

interface Props {
  gameId: string;
  onBack: () => void;
}

type TabKey = "rules" | "local" | "ai" | "pvp" | "puzzle";

const tabs: TabKey[] = ["rules", "local", "ai", "pvp", "puzzle"];

const GamePage: React.FC<Props> = ({ gameId, onBack }) => {
  const meta = gameList.find((g) => g.id === gameId);
  const [tab, setTab] = useState<TabKey>("rules");

  if (!meta) return null;
  if (meta.id === "go") {
    return (
      <section className="game-page">
        <div className="game-header">
          <button type="button" onClick={onBack}>
            回到首頁
          </button>
          <div>
            <h1>{meta.title}</h1>
            <p>{meta.subtitle}</p>
          </div>
        </div>
        <GoPage />
      </section>
    );
  }

  const engine = meta.engine as GameEngine | undefined;
  const [size, setSize] = useState<number>(engine?.sizeOptions?.[0] ?? 9);
  const [state, setState] = useState<GameStateBase>(() => (engine ? engine.init(size) : ({} as GameStateBase)));

  const sizes = engine?.sizeOptions ?? [9, 11, 13, 15, 17, 19];
  const rules = useMemo(() => meta.rules ?? [], [meta]);

  return (
    <section className="game-page">
      <div className="game-header">
        <button type="button" onClick={onBack}>
          回到首頁
        </button>
        <div>
          <h1>{meta.title}</h1>
          <p>{meta.subtitle}</p>
        </div>
      </div>

      <div className="tab-bar">
        {tabs.map((t) => (
          <button key={t} type="button" className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t === "rules" && "規則"}
            {t === "local" && "本機對戰"}
            {t === "ai" && "AI 對戰"}
            {t === "pvp" && "連線對戰"}
            {t === "puzzle" && "題目"}
          </button>
        ))}
      </div>

      {(tab === "local" || tab === "ai") && engine && (
        <div className="row-gap">
          <label htmlFor="game-size" className="field-row">
            棋盤大小
            <select
              id="game-size"
              value={size}
              onChange={(e) => {
                const next = Number(e.target.value);
                setSize(next);
                setState(engine.init(next));
              }}
            >
              {sizes.map((s) => (
                <option key={s} value={s}>
                  {s} x {s}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {tab === "rules" && (
        <section className="mode-panel">
          <h2>規則介紹</h2>
          <ul>
            {rules.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      )}

      {tab === "local" && engine && <GenericLocalPlay engine={engine} size={size} state={state} onStateChange={setState} />}

      {tab === "ai" && engine && <GenericAIPlay engine={engine} size={size} state={state} onStateChange={setState} />}

      {tab === "pvp" && (
        <section className="mode-panel">
          <h2>連線對戰</h2>
          <p>此功能需要密碼驗證，後續接入 `/api/auth` 與 WebSocket。</p>
          <input placeholder="輸入密碼" type="password" />
          <button type="button">驗證並進入</button>
        </section>
      )}

      {tab === "puzzle" && meta.supportsPuzzle && (
        <section className="mode-panel">
          <p>題庫功能準備中，後續可接入 API 題庫。</p>
        </section>
      )}

      {tab === "puzzle" && !meta.supportsPuzzle && (
        <section className="mode-panel">
          <p>此棋類暫無題庫。</p>
        </section>
      )}
    </section>
  );
};

export default GamePage;
