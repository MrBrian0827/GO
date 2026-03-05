import React, { useEffect, useState } from "react";
import Board from "./Board";
import { createInitialState, playMove } from "./goLogic";

interface PuzzleItem {
  id: string;
  level: "初級" | "中級";
  title: string;
  size: number;
  answer: { row: number; col: number };
  hint: string;
}

const puzzles: PuzzleItem[] = [
  { id: "B-001", level: "初級", title: "吃子題", size: 5, answer: { row: 2, col: 2 }, hint: "看對方最後一口氣。" },
  { id: "B-002", level: "初級", title: "打吃題", size: 7, answer: { row: 3, col: 2 }, hint: "先讓對方只剩一口氣。" },
  { id: "M-001", level: "中級", title: "簡單死活", size: 9, answer: { row: 4, col: 5 }, hint: "找能同時做眼與封鎖的點。" },
  { id: "M-002", level: "中級", title: "連環打吃", size: 9, answer: { row: 5, col: 4 }, hint: "先手後仍保留追殺節奏。" }
];

const Puzzle: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [msg, setMsg] = useState("請找出第一手。\n");
  const current = puzzles[index];
  const [state, setState] = useState(createInitialState(current.size));

  useEffect(() => {
    setState(createInitialState(current.size));
    setMsg("請找出第一手。\n");
  }, [index]);

  const onPlay = (row: number, col: number) => {
    const result = playMove(state, row, col);
    if (!result.ok) {
      setMsg(result.message ?? "不合法");
      return;
    }

    setState(result.state);
    if (row === current.answer.row && col === current.answer.col) {
      setMsg("答對！這是題目主解。\n");
    } else {
      setMsg("不是最佳解，請再試一次。\n");
    }
  };

  return (
    <section>
      <h2>練習題庫</h2>
      <p>
        {current.level} - {current.title}（{current.id}）
      </p>
      <p>結果：{msg}</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
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
      <Board state={state} onPlay={onPlay} onPass={() => {}} />
    </section>
  );
};

export default Puzzle;
