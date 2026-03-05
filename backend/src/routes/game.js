const express = require("express");
const { register, login, createGameRoom, getGames } = require("../controllers/gameController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/rooms", createGameRoom);
router.get("/rooms", getGames);

module.exports = router;
