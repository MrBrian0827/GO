import React, { useEffect, useState } from "react";
import Board from "./Board";
import { createInitialState, playMove } from "./goLogic";
import type { GameState, StoneColor } from "./goLogic";
import { fetchTutorials } from "../network/api";

interface SetupStone {
  row: number;
  col: number;
  color: StoneColor;
}

interface Lesson {
  id: number;
  title: string;
  text: string;
  size: number;
  target?: { row: number; col: number };
  setup: SetupStone[];
  turn: StoneColor;
  wrongTip: string;
}

function buildState(size: number, setup: SetupStone[], turn: StoneColor): GameState {
  const state = createInitialState(size);
  const board = state.board.map((row) => [...row]);

  for (const stone of setup) {
    if (stone.row < 0 || stone.row >= size || stone.col < 0 || stone.col >= size) continue;
    board[stone.row][stone.col] = stone.color;
  }

  return {
    ...state,
    board,
    turn,
    previousBoardHash: null,
    moves: []
  };
}

const fallbackLessons: Lesson[] = [
  {
    id: 1,
    title: "氣、打吃、提子",
    text: "白棋只剩一口氣，請找出打吃位置。",
    size: 5,
    target: { row: 2, col: 3 },
    setup: [
      { row: 2, col: 2, color: "W" },
      { row: 1, col: 2, color: "B" },
      { row: 3, col: 2, color: "B" },
      { row: 2, col: 1, color: "B" }
    ],
    turn: "B",
    wrongTip: "這一步沒有讓對方氣變少，請再看看。"
  },
  {
    id: 2,
    title: "兩眼活棋",
    text: "白棋需要做兩眼，先下在眼位。",
    size: 7,
    target: { row: 3, col: 3 },
    setup: [
      { row: 2, col: 2, color: "W" },
      { row: 2, col: 3, color: "W" },
      { row: 2, col: 4, color: "W" },
      { row: 3, col: 2, color: "W" },
      { row: 3, col: 4, color: "W" },
      { row: 4, col: 2, color: "W" },
      { row: 4, col: 3, color: "W" },
      { row: 4, col: 4, color: "W" },
      { row: 1, col: 3, color: "B" },
      { row: 5, col: 3, color: "B" }
    ],
    turn: "W",
    wrongTip: "這不是眼位，兩眼才能確保活棋。"
  },
  {
    id: 3,
    title: "基本死活與地形",
    text: "黑棋要先手做活或封鎖，找關鍵點。",
    size: 9,
    target: { row: 4, col: 4 },
    setup: [
      { row: 4, col: 3, color: "B" },
      { row: 3, col: 4, color: "B" },
      { row: 5, col: 4, color: "B" },
      { row: 4, col: 5, color: "W" },
      { row: 2, col: 4, color: "W" }
    ],
    turn: "B",
    wrongTip: "這步無法增加生存空間，請再思考。"
  }
];

const Tutorial: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>(fallbackLessons);
  const [lessonIndex, setLessonIndex] = useState(0);
  const lesson = lessons[lessonIndex] ?? fallbackLessons[0];
  const [state, setState] = useState<GameState>(buildState(lesson.size, lesson.setup, lesson.turn));
  const [hint, setHint] = useState("請先下出第一手重點位置。");

  useEffect(() => {
    const load = async () => {
      try {
        const apiLessons = await fetchTutorials();
        if (!Array.isArray(apiLessons) || !apiLessons.length) return;

        const merged = apiLessons.map((item: { id: number; title: string; content: string }, idx: number) => {
          const base = fallbackLessons[idx] ?? fallbackLessons[fallbackLessons.length - 1];
          return {
            ...base,
            id: item.id,
            title: item.title,
            text: item.content
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
    setState(buildState(lesson.size, lesson.setup, lesson.turn));
    setHint("請先下出第一手重點位置。");
  }, [lessonIndex, lesson]);

  const onPlay = (row: number, col: number) => {
    const result = playMove(state, row, col);
    if (!result.ok) {
      setHint(result.message ?? "這手不合法");
      return;
    }

    setState(result.state);
    if (state.moveNumber === 0 && lesson.target && lesson.target.row === row && lesson.target.col === col) {
      setHint("正確！這是本課第一手重點。可繼續下看看變化。"
      );
    } else if (state.moveNumber === 0) {
      setHint(lesson.wrongTip);
    } else {
      setHint("繼續嘗試，觀察氣與連接關係。");
    }
  };

  return (
    <section className="mode-panel">
      <h2>新手教學</h2>
      <p>{lesson.text}</p>
      <p>提示：{hint}</p>
      <div className="row-gap" style={{ marginBottom: 12 }}>
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
      <Board state={state} onPlay={onPlay} onPass={() => {}} onReset={() => setState(buildState(lesson.size, lesson.setup, lesson.turn))} />
    </section>
  );
};

export default Tutorial;
