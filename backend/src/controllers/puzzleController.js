const { getPuzzles } = require("../models/puzzleModel");

function listPuzzles(req, res) {
  const { level } = req.query;
  res.json(getPuzzles(level));
}

module.exports = {
  listPuzzles
};
