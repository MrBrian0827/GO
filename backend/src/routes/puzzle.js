const express = require("express");
const { listPuzzles } = require("../controllers/puzzleController");

const router = express.Router();
router.get("/", listPuzzles);

module.exports = router;
