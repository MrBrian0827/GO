import React, { useEffect, useMemo, useRef, useState } from "react";
import Board from "./components/Board";
import Tutorial from "./components/Tutorial";
import Puzzle from "./components/Puzzle";
import { chooseAIMove } from "./components/AIPlayer";
import { createInitialState, passTurn, playMove } from "./components/goLogic";
import type { GameState, StoneColor } from "./components/goLogic";
import { exportStateToSgf } from "./sgf/exportSgf";
import { importSgfToState } from "./sgf/importSgf";
import { GameSocket } from "./network/websocket";
import { login, register } from "./network/api";
import "./styles/board.css";

const modes = ["本地雙人", "對 AI", "線上對弈", "教學", "題庫", "棋譜回放"] as const;
type Mode = (typeof modes)[number];

function replayStateFromMoves(size: number, moves: GameState["moves"], steps: number): GameState {
  let state = createInitialState(size);
  const clip = moves.slice(0, steps);

  for (const move of clip) {
    if (move.pass) {
      state = passTurn(state);
      continue;
    }
    if (typeof move.row !== "number" || typeof move.col !== "number") continue;
    const result = playMove(state, move.row, move.col);
    if (result.ok) state = result.state;
  }

  return state;
}

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>("本地雙人");
  const [size, setSize] = useState(5);
  const [state, setState] = useState<GameState>(createInitialState(5));
  const [message, setMessage] = useState("準備開始");
  const [sgf, setSgf] = useState("");
  const [replayIndex, setReplayIndex] = useState(0);
  const [onlineStatus, setOnlineStatus] = useState("未連線");
  const [roomId, setRoomId] = useState("demo-room");
  const [myColor] = useState<StoneColor>("B");
  const [username, setUsername] = useState("guest");
  const [password, setPassword] = useState("guest123");
  const [token, setToken] = useState("");
  const wsRef = useRef<GameSocket | null>(null);

  useEffect(() => {
    setState(createInitialState(size));
    setReplayIndex(0);
    setMessage("已重設棋盤");
  }, [size]);

  useEffect(() => {
    if (mode !== "線上對弈") return;

    const socket = new GameSocket();
    wsRef.current = socket;
    socket.connect(
      (msg) => {
        if (msg.type === "room_state" && msg.state) {
          setState(msg.state as GameState);
        }
        if (msg.type === "info" && typeof msg.message === "string") {
          setMessage(msg.message);
        }
      },
      (status) => setOnlineStatus(status)
    );

    return () => socket.close();
  }, [mode]);

  const onPlay = (row: number, col: number) => {
    if (mode === "棋譜回放") return;

    if (mode === "線上對弈") {
      wsRef.current?.send({ type: "move", roomId, row, col });
      return;
    }

    if (mode === "對 AI" && state.turn !== myColor) return;

    const result = playMove(state, row, col);
    if (!result.ok) {
      setMessage(result.message ?? "不合法手");
      return;
    }

    setState(result.state);
    setMessage("落子成功");

    if (mode === "對 AI") {
      setTimeout(() => {
        const aiMove = chooseAIMove(result.state, result.state.turn);
        if (!aiMove) {
          setState((prev) => passTurn(prev));
          setMessage("AI Pass");
          return;
        }

        setState((prev) => {
          const aiResult = playMove(prev, aiMove.row, aiMove.col);
          return aiResult.ok ? aiResult.state : prev;
        });
      }, 450);
    }
  };

  const onPass = () => {
    if (mode === "線上對弈") {
      wsRef.current?.send({ type: "pass", roomId });
      return;
    }
    setState((prev) => passTurn(prev));
    setMessage("Pass");
  };

  const exportSgf = () => {
    const text = exportStateToSgf(state);
    setSgf(text);
    setMessage("已匯出 SGF");
  };

  const importSgf = () => {
    if (!sgf.trim()) return;
    const next = importSgfToState(sgf.trim());
    setState(next);
    setReplayIndex(next.moves.length);
    setMessage("已匯入 SGF");
  };

  const replayState = useMemo(() => {
    if (mode !== "棋譜回放") return state;
    return replayStateFromMoves(state.size, state.moves, replayIndex);
  }, [mode, replayIndex, state]);

  const onRegister = async () => {
    try {
      const result = await register(username, password);
      setToken(result.token);
      setMessage(`註冊成功：${result.user.username}`);
    } catch {
      setMessage("註冊失敗，請檢查帳號是否重複");
    }
  };

  const onLogin = async () => {
    try {
      const result = await login(username, password);
      setToken(result.token);
      setMessage(`登入成功：${result.user.username}`);
    } catch {
      setMessage("登入失敗，請檢查帳密");
    }
  };

  return (
    <main className="app-shell">
      <header>
        <h1>GO - 線上圍棋學習與對弈平台</h1>
        <p>{message}</p>
      </header>

      <section className="controls">
        {modes.map((m) => (
          <button key={m} type="button" className={mode === m ? "active" : ""} onClick={() => setMode(m)}>
            {m}
          </button>
        ))}

        <label htmlFor="size">棋盤尺寸</label>
        <select id="size" value={size} onChange={(e) => setSize(Number(e.target.value))}>
          {[5, 6, 7, 8].map((s) => (
            <option key={s} value={s}>
              {s} x {s}
            </option>
          ))}
        </select>
      </section>

      {(mode === "本地雙人" || mode === "對 AI" || mode === "線上對弈" || mode === "棋譜回放") && (
        <>
          <Board
            state={mode === "棋譜回放" ? replayState : state}
            onPlay={onPlay}
            onPass={onPass}
            readOnly={mode === "棋譜回放"}
          />

          <section className="sgf-panel">
            <h3>棋譜 SGF</h3>
            <textarea value={sgf} onChange={(e) => setSgf(e.target.value)} rows={6} />
            <div className="row-gap">
              <button type="button" onClick={exportSgf}>
                匯出 SGF
              </button>
              <button type="button" onClick={importSgf}>
                匯入 SGF
              </button>
            </div>
            {mode === "棋譜回放" && (
              <div className="row-gap">
                <button type="button" onClick={() => setReplayIndex((p) => Math.max(0, p - 1))}>
                  後退
                </button>
                <span>
                  {replayIndex} / {state.moves.length}
                </span>
                <button type="button" onClick={() => setReplayIndex((p) => Math.min(state.moves.length, p + 1))}>
                  前進
                </button>
              </div>
            )}
          </section>

          {mode === "線上對弈" && (
            <section className="online-panel">
              <h3>線上多人（WebSocket）</h3>
              <p>連線狀態：{onlineStatus}</p>
              <div className="row-gap">
                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="帳號" />
                <input
                  value={password}
                  type="password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="密碼"
                />
                <button type="button" onClick={onRegister}>
                  註冊
                </button>
                <button type="button" onClick={onLogin}>
                  登入
                </button>
              </div>
              <p>登入狀態：{token ? "已登入" : "未登入"}</p>
              <div className="row-gap">
                <input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="room id" />
                <button type="button" onClick={() => wsRef.current?.send({ type: "join_room", roomId })}>
                  加入房間
                </button>
                <button type="button" onClick={() => wsRef.current?.send({ type: "spectate", roomId })}>
                  觀戰
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {mode === "教學" && <Tutorial />}
      {mode === "題庫" && <Puzzle />}
    </main>
  );
};

export default App;
