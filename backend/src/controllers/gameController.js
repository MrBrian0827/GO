const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createUser, findUserByUsername, createGame, listGames } = require("../models/gameModel");

const JWT_SECRET = process.env.JWT_SECRET || "replace-this-secret";

function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
}

async function register(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "缺少帳號或密碼" });

    const existing = findUserByUsername(username);
    if (existing) return res.status(409).json({ error: "帳號已存在" });

    const hash = await bcrypt.hash(password, 10);
    const user = createUser(username, hash);
    const token = signToken(user);

    return res.json({ token, user });
  } catch (error) {
    return res.status(500).json({ error: "註冊失敗", detail: error.message });
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body;
    const user = findUserByUsername(username);
    if (!user) return res.status(401).json({ error: "帳密錯誤" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "帳密錯誤" });

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, username: user.username } });
  } catch (error) {
    return res.status(500).json({ error: "登入失敗", detail: error.message });
  }
}

function createGameRoom(req, res) {
  try {
    const { roomId, size = 19, createdBy = null } = req.body;
    if (!roomId) return res.status(400).json({ error: "缺少 roomId" });

    const game = createGame(roomId, size, createdBy);
    return res.json(game);
  } catch (error) {
    return res.status(500).json({ error: "建立房間失敗", detail: error.message });
  }
}

function getGames(req, res) {
  return res.json(listGames());
}

module.exports = {
  register,
  login,
  createGameRoom,
  getGames
};
