const lessons = [
  {
    id: 1,
    title: "氣",
    content: "棋子上下左右的空點是氣，沒有氣就會被提走。"
  },
  {
    id: 2,
    title: "打吃",
    content: "當對方棋群只剩一口氣即為打吃，下一手可提子。"
  },
  {
    id: 3,
    title: "吃子練習",
    content: "透過封鎖氣的方式完成提子。"
  },
  {
    id: 4,
    title: "兩眼活棋",
    content: "形成兩眼的棋群通常無法被提。"
  },
  {
    id: 5,
    title: "簡單死活題",
    content: "觀察關鍵眼位，判斷先手活棋或殺棋。"
  }
];

function listTutorials(req, res) {
  res.json(lessons);
}

module.exports = {
  listTutorials
};
