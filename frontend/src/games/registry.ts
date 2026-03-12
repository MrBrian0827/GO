import { gomokuEngine } from "./gomoku";
import { othelloEngine } from "./othello";
import type { GameEngine } from "./types";
import { xiangqiRules } from "./rules/xiangqi";
import { createEngineFromRules } from "./createEngine";

export interface GameMeta {
  id: string;
  title: string;
  subtitle: string;
  status: "ready" | "beta";
  engine?: GameEngine;
  rules: string[];
  supportsPuzzle: boolean;
}

const xiangqiEngine = createEngineFromRules(xiangqiRules);

export const gameList: GameMeta[] = [
  {
    id: "go",
    title: "圍棋 Go",
    subtitle: "經典圍地與吃子",
    status: "ready",
    rules: [
      "棋盤常見 19x19，黑先白後。",
      "提子與氣、禁止自殺與簡單 Ko。",
      "雙方連續 Pass 即結束。"
    ],
    supportsPuzzle: true
  },
  {
    id: "xiangqi",
    title: "中國象棋 Xiangqi",
    subtitle: "象棋經典對戰",
    status: "ready",
    engine: xiangqiEngine,
    rules: xiangqiEngine.rules,
    supportsPuzzle: true
  },
  {
    id: "darkchess",
    title: "暗棋 Dark Chess",
    subtitle: "翻棋與吃子",
    status: "beta",
    rules: [
      "棋盤 4x8，棋子翻開後再移動。",
      "Beta 版本先提供規則與介面。",
      "後續可加入棋子價值評估 AI。"
    ],
    supportsPuzzle: false
  },
  {
    id: "shogi",
    title: "日本將棋 Shogi",
    subtitle: "王將對戰",
    status: "beta",
    rules: [
      "棋盤 9x9，棋子可升變。",
      "Beta 版本先提供規則與介面。",
      "後續可接入 YaneuraOu 引擎。"
    ],
    supportsPuzzle: true
  },
  {
    id: "gomoku",
    title: "五子棋 Gomoku",
    subtitle: "連成五子",
    status: "ready",
    engine: gomokuEngine,
    rules: gomokuEngine.rules,
    supportsPuzzle: false
  },
  {
    id: "othello",
    title: "黑白棋 Othello",
    subtitle: "翻轉決勝",
    status: "ready",
    engine: othelloEngine,
    rules: othelloEngine.rules,
    supportsPuzzle: false
  }
];
