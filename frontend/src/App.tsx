import React, { useRef, useState } from "react";
import LocalPlay from "./components/modes/LocalPlay";
import AIPlay from "./components/modes/AIPlay";
import Tutorial from "./components/Tutorial";
import Board from "./components/Board";
import { createInitialState } from "./components/goLogic";
import type { GameState, StoneColor } from "./components/goLogic";
import "./styles/board.css";

type TabKey = "rules" | "local" | "ai" | "tutorial" | "pvp";

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
        <p>支援本機對戰、AI 對戰、教學與連線測試房。</p>
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
        {(["rules", "local", "ai", "tutorial", "pvp"] as TabKey[]).map((t) => (
          <button key={t} type="button" className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t === "rules" && "規則"}
            {t === "local" && "本機對戰"}
            {t === "ai" && "AI 對戰"}
            {t === "tutorial" && "教學"}
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

      {tab === "pvp" && (
        <section className="mode-panel">
          <h2>連線對戰</h2>
          <p>進入測試房前需先輸入密碼。</p>
          <PvpGate />
        </section>
      )}
    </main>
  );
};

const PvpGate: React.FC = () => {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("未驗證");
  const [verified, setVerified] = useState(false);

  const onVerify = async () => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      if (!res.ok) throw new Error("bad");
      setVerified(true);
      setStatus("驗證成功，可加入測試房");
    } catch {
      setVerified(false);
      setStatus("驗證失敗");
    }
  };

  return (
    <div className="row-gap">
      <input placeholder="輸入密碼" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="button" onClick={onVerify}>
        驗證
      </button>
      <span>{status}</span>
      {verified && <PvpRoom />}
    </div>
  );
};

const PvpRoom: React.FC = () => {
  const roomId = "test-room";
  const [status, setStatus] = useState("未連線");
  const [role, setRole] = useState<StoneColor | "S" | null>(null);
  const [state, setState] = useState<GameState>(createInitialState(19));
  const wsRef = useRef<WebSocket | null>(null);

  const connect = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${window.location.host}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("已連線");
      ws.send(JSON.stringify({ type: "join_room", roomId, size: state.size }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "room_state" && msg.state) {
          setState(msg.state);
        }
        if (msg.type === "info" && msg.message) {
          setStatus(msg.message);
          if (typeof msg.message === "string") {
            if (msg.message.includes("執 B")) setRole("B");
            else if (msg.message.includes("執 W")) setRole("W");
            else if (msg.message.includes("觀戰") || msg.message.includes("已滿")) setRole("S");
          }
        }
      } catch {
        setStatus("訊息解析失敗");
      }
    };

    ws.onclose = () => {
      setStatus("已斷線");
      setRole(null);
    };
  };

  const onPlay = (row: number, col: number) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setStatus("尚未連線");
      return;
    }
    if (role !== "B" && role !== "W") {
      setStatus("目前為觀戰模式");
      return;
    }
    if (state.turn !== role) {
      setStatus("尚未輪到你");
      return;
    }
    ws.send(JSON.stringify({ type: "move", roomId, row, col }));
  };

  const onPass = () => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setStatus("尚未連線");
      return;
    }
    if (role !== "B" && role !== "W") {
      setStatus("目前為觀戰模式");
      return;
    }
    if (state.turn !== role) {
      setStatus("尚未輪到你");
      return;
    }
    ws.send(JSON.stringify({ type: "pass", roomId }));
  };

  return (
    <div className="row-gap">
      <div className="row-gap">
        <button type="button" onClick={connect}>
          加入測試房
        </button>
        <span>狀態：{status}</span>
        <span>角色：{role ? (role === "B" ? "黑" : role === "W" ? "白" : "觀戰") : "未指派"}</span>
      </div>

      <Board
        state={state}
        onPlay={onPlay}
        onPass={onPass}
        readOnly={role !== "B" && role !== "W"}
        stoneTheme="classic"
      />
    </div>
  );
};

export default App;

