import React, { useEffect, useState } from "react";
import Board from "./Board";
import { createInitialState, playMove } from "./goLogic";
import type { GameState, StoneColor } from "./goLogic";
import { fetchPuzzles } from "../network/api";

interface SetupStone {
  row: number;
  col: number;
  color: StoneColor;
}

interface PuzzleItem {
  id: string;
  level: "初級" | "中級";
  title: string;
  size: number;
  answer: { row: number; col: number };
  hint: string;
  setup: SetupStone[];
  turn: StoneColor;
}

function buildState(size: number, setup: SetupStone[], turn: StoneColor): GameState {
  const state = createInitialState(size);
  const board = state.board.map((row) => [...row]);

  for (const stone of setup) {
    if (stone.row < 0 || stone.row >= size || stone.col < 0 || stone.col >= size) continue;
    board[stone.row][stone.col] = stone.color;
  }

  return { ...state, board, turn, moves: [] };
}

const fallbackPuzzles: PuzzleItem[] = [
  {
    id: "B-001",
    level: "初級",
    title: "吃子題",
    size: 7,
    answer: { row: 3, col: 4 },
    hint: "白棋只剩最後一口氣。",
    setup: [
      { row: 3, col: 3, color: "W" },
      { row: 2, col: 3, color: "B" },
      { row: 4, col: 3, color: "B" },
      { row: 3, col: 2, color: "B" }
    ],
    turn: "B"
  },
  {
    id: "B-002",
    level: "初級",
    title: "連線題",
    size: 9,
    answer: { row: 4, col: 4 },
    hint: "先連接兩邊黑棋，避免被切斷。",
    setup: [
      { row: 4, col: 3, color: "B" },
      { row: 4, col: 5, color: "B" },
      { row: 3, col: 4, color: "W" },
      { row: 5, col: 4, color: "W" }
    ],
    turn: "B"
  },
  {
    id: "M-001",
    level: "中級",
    title: "角地擴張",
    size: 11,
    answer: { row: 2, col: 2 },
    hint: "角上先手通常效率高。",
    setup: [
      { row: 1, col: 1, color: "B" },
      { row: 1, col: 3, color: "W" },
      { row: 3, col: 1, color: "W" }
    ],
    turn: "B"
  },
  {
    id: "M-002",
    level: "中級",
    title: "簡單死活",
    size: 9,
    answer: { row: 4, col: 5 },
    hint: "找可同時做眼與打吃的點。",
    setup: [
      { row: 4, col: 4, color: "W" },
      { row: 3, col: 4, color: "B" },
      { row: 5, col: 4, color: "B" },
      { row: 4, col: 3, color: "B" }
    ],
    turn: "B"
  },
  {
    id: "M-003",
    level: "中級",
    title: "打吃連段",
    size: 13,
    answer: { row: 6, col: 7 },
    hint: "先形成先手打吃，再追擊。",
    setup: [
      { row: 6, col: 6, color: "W" },
      { row: 5, col: 6, color: "B" },
      { row: 7, col: 6, color: "B" },
      { row: 6, col: 5, color: "B" }
    ],
    turn: "B"
  }
];

const Puzzle: React.FC = () => {
  const [puzzles, setPuzzles] = useState<PuzzleItem[]>(fallbackPuzzles);
  const [index, setIndex] = useState(0);
  const [msg, setMsg] = useState("請找出第一手。\n");
  const current = puzzles[index] ?? fallbackPuzzles[0];
  const [state, setState] = useState(buildState(current.size, current.setup, current.turn));

  useEffect(() => {
    const load = async () => {
      try {
        const apiPuzzles = await fetchPuzzles();
        if (!Array.isArray(apiPuzzles) || !apiPuzzles.length) return;

        const mapped: PuzzleItem[] = apiPuzzles.map(
          (
            item: {
              id: string;
              level: "beginner" | "intermediate";
              title: string;
              hint?: string;
              answer?: { row: number; col: number };
            },
            idx: number
          ) => {
            const base = fallbackPuzzles[idx % fallbackPuzzles.length];
            return {
              ...base,
              id: item.id,
              level: item.level === "intermediate" ? "中級" : "初級",
              title: item.title,
              hint: item.hint ?? base.hint,
              answer: item.answer ?? base.answer
            };
          }
        );

        setPuzzles(mapped);
      } catch {
        setPuzzles(fallbackPuzzles);
      }
    };

    load();
  }, []);

  useEffect(() => {
    setState(buildState(current.size, current.setup, current.turn));
    setMsg("請找出第一手。\n");
  }, [index, current]);

  const onPlay = (row: number, col: number) => {
    const result = playMove(state, row, col);
    if (!result.ok) {
      setMsg(result.message ?? "不合法");
      return;
    }

    setState(result.state);
    if (state.moveNumber === 0 && row === current.answer.row && col === current.answer.col) {
      setMsg("答對！這是題目主解。\n");
    } else if (state.moveNumber === 0) {
      setMsg("不是最佳解，請再試一次，或先看提示。\n");
    } else {
      setMsg("可繼續嘗試後續變化。\n");
    }
  };

  return (
    <section className="mode-panel">
      <h2>練習題庫</h2>
      <p>
        {current.level} - {current.title}（{current.id}）
      </p>
      <p>結果：{msg}</p>
      <div className="row-gap" style={{ marginBottom: 12 }}>
        <button type="button" onClick={() => setMsg(`提示：${current.hint}`)}>
          顯示提示
        </button>
        <button type="button" onClick={() => setMsg(`解答：(${current.answer.row}, ${current.answer.col})`)}>
          顯示解答
        </button>
        <button type="button" onClick={() => setIndex((prev) => (prev + 1) % puzzles.length)}>
          下一題
        </button>
      </div>
      <Board state={state} onPlay={onPlay} onPass={() => {}} onReset={() => setState(buildState(current.size, current.setup, current.turn))} />
    </section>
  );
};

export default Puzzle;
