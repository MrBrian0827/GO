const path = require("path");
const Database = require("better-sqlite3");

const dbPath = process.env.DB_PATH || path.join(__dirname, "..", "..", "..", "go.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT UNIQUE NOT NULL,
  size INTEGER NOT NULL,
  status TEXT NOT NULL,
  sgf TEXT,
  created_by INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(created_by) REFERENCES users(id)
);
`);

function createUser(username, passwordHash) {
  const stmt = db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
  const result = stmt.run(username, passwordHash);
  return { id: result.lastInsertRowid, username };
}

function findUserByUsername(username) {
  return db.prepare("SELECT id, username, password_hash FROM users WHERE username = ?").get(username);
}

function createGame(roomId, size, createdBy = null) {
  const stmt = db.prepare("INSERT INTO games (room_id, size, status, created_by) VALUES (?, ?, 'waiting', ?)");
  stmt.run(roomId, size, createdBy);
  return { roomId, size, status: "waiting" };
}

function updateGameSgf(roomId, sgf, status = "finished") {
  const stmt = db.prepare("UPDATE games SET sgf = ?, status = ? WHERE room_id = ?");
  stmt.run(sgf, status, roomId);
}

function listGames() {
  return db.prepare("SELECT id, room_id AS roomId, size, status, created_at AS createdAt FROM games ORDER BY id DESC").all();
}

module.exports = {
  db,
  createUser,
  findUserByUsername,
  createGame,
  updateGameSgf,
  listGames
};
