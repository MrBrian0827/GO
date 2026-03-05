const puzzles = [
  { id: "B-001", level: "beginner", title: "吃子題", hint: "看對方最後一口氣", answer: { row: 2, col: 2 } },
  { id: "B-002", level: "beginner", title: "打吃題", hint: "先打吃再封鎖", answer: { row: 3, col: 2 } },
  { id: "M-001", level: "intermediate", title: "簡單死活", hint: "搶眼位", answer: { row: 4, col: 5 } }
];

function getPuzzles(level) {
  if (!level) return puzzles;
  return puzzles.filter((p) => p.level === level);
}

module.exports = {
  getPuzzles
};
