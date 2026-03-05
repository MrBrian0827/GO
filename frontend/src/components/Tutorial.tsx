import React, { useEffect, useState } from "react";
import Board from "./Board";
import { createInitialState, playMove } from "./goLogic";

interface Lesson {
  id: number;
  title: string;
  text: string;
  size: number;
  target?: { row: number; col: number };
}

const lessons: Lesson[] = [
  { id: 1, title: "氣", text: "棋子周圍上下左右空點為氣，氣被封住就會被提走。", size: 5, target: { row: 2, col: 2 } },
  { id: 2, title: "打吃", text: "當對方只剩一口氣時即為打吃。", size: 7, target: { row: 3, col: 3 } },
  { id: 3, title: "吃子練習", text: "試著在關鍵點落子，完成提子。", size: 7, target: { row: 2, col: 3 } },
  { id: 4, title: "兩眼活棋", text: "擁有兩個真眼通常可確保活棋。", size: 9, target: { row: 4, col: 4 } },
  { id: 5, title: "簡單死活", text: "判斷此棋群可否做活，並下出正確第一手。", size: 9, target: { row: 5, col: 4 } }
];

const Tutorial: React.FC = () => {
  const [lessonIndex, setLessonIndex] = useState(0);
  const lesson = lessons[lessonIndex];
  const [state, setState] = useState(createInitialState(lesson.size));
  const [hint, setHint] = useState("請下出你認為正確的一手。\n");

  useEffect(() => {
    setState(createInitialState(lesson.size));
    setHint("請下出你認為正確的一手。\n");
  }, [lessonIndex]);

  const onPlay = (row: number, col: number) => {
    const result = playMove(state, row, col);
    if (!result.ok) {
      setHint(result.message ?? "這手不合法");
      return;
    }

    setState(result.state);
    if (lesson.target && lesson.target.row === row && lesson.target.col === col) {
      setHint("正確！你找到本課重點落子。\n");
    } else {
      setHint("這手可以下，但不是本課重點手，試試看其他點。\n");
    }
  };

  return (
    <section>
      <h2>初學者教學</h2>
      <p>{lesson.text}</p>
      <p>提示：{hint}</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {lessons.map((l, idx) => (
          <button
            key={l.id}
            type="button"
            className={idx === lessonIndex ? "active" : ""}
            onClick={() => setLessonIndex(idx)}
          >
            第{l.id}課：{l.title}
          </button>
        ))}
      </div>
      <Board state={state} onPlay={onPlay} onPass={() => {}} />
    </section>
  );
};

export default Tutorial;
