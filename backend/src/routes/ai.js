const express = require("express");
const { getAIMove } = require("../controllers/aiController");

const router = express.Router();
router.post("/move", getAIMove);

module.exports = router;
