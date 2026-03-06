import React, { useEffect, useState } from "react";
import Board from "./Board";
import { createInitialState, playMove } from "./goLogic";
import { fetchTutorials } from "../network/api";

interface Lesson {
  id: number;
  title: string;
  text: string;
  size: number;
  target?: { row: number; col: number };
}

const fallbackLessons: Lesson[] = [
  { id: 1, title: "氣", text: "棋子周圍上下左右空點為氣，氣被封住就會被提走。", size: 5, target: { row: 2, col: 2 } },
  { id: 2, title: "打吃", text: "當對方只剩一口氣時即為打吃。", size: 6, target: { row: 3, col: 3 } },
  { id: 3, title: "吃子練習", text: "試著在關鍵點落子，完成提子。", size: 7, target: { row: 2, col: 3 } },
  { id: 4, title: "兩眼活棋", text: "擁有兩個真眼通常可確保活棋。", size: 8, target: { row: 4, col: 4 } },
  { id: 5, title: "簡單死活", text: "判斷此棋群可否做活，並下出正確第一手。", size: 8, target: { row: 5, col: 4 } }
];

const Tutorial: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>(fallbackLessons);
  const [lessonIndex, setLessonIndex] = useState(0);
  const lesson = lessons[lessonIndex] ?? fallbackLessons[0];
  const [state, setState] = useState(createInitialState(lesson.size));
  const [hint, setHint] = useState("請下出你認為正確的一手。");

  useEffect(() => {
    const load = async () => {
      try {
        const apiLessons = await fetchTutorials();
        if (!Array.isArray(apiLessons) || !apiLessons.length) return;

        const merged = apiLessons.map((item: { id: number; title: string; content: string }, idx: number) => {
          const base = fallbackLessons[idx] ?? fallbackLessons[fallbackLessons.length - 1];
          return {
            id: item.id,
            title: item.title,
            text: item.content,
            size: base.size,
            target: base.target
          } as Lesson;
        });

        setLessons(merged);
      } catch {
        setLessons(fallbackLessons);
      }
    };

    load();
  }, []);

  useEffect(() => {
    setState(createInitialState(lesson.size));
    setHint("請下出你認為正確的一手。");
  }, [lessonIndex, lesson.size]);

  const onPlay = (row: number, col: number) => {
    const result = playMove(state, row, col);
    if (!result.ok) {
      setHint(result.message ?? "這手不合法");
      return;
    }

    setState(result.state);
    if (lesson.target && lesson.target.row === row && lesson.target.col === col) {
      setHint("正確！你找到本課重點落子。");
    } else {
      setHint("這手可以下，但不是本課重點手。可按「顯示答案」查看。\n");
    }
  };

  return (
    <section>
      <h2>初學者教學</h2>
      <p>{lesson.text}</p>
      <p>提示：{hint}</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
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
        <button
          type="button"
          onClick={() =>
            setHint(
              lesson.target
                ? `答案：(${lesson.target.row}, ${lesson.target.col})`
                : "目前課程未提供固定答案，請先理解概念說明。"
            )
          }
        >
          顯示答案
        </button>
      </div>
      <Board state={state} onPlay={onPlay} onPass={() => {}} />
    </section>
  );
};

export default Tutorial;
