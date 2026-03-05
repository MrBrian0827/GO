const { WebSocketServer } = require("ws");

function createEmptyBoard(size) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null));
}

function opposite(color) {
  return color === "B" ? "W" : "B";
}

function boardHash(board) {
  return board.map((row) => row.map((c) => c || ".").join("")).join("/");
}

function inBounds(size, row, col) {
  return row >= 0 && row < size && col >= 0 && col < size;
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

const dirs = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1]
];

function getGroup(board, row, col) {
  const color = board[row][col];
  if (!color) return [];

  const stack = [[row, col]];
  const seen = new Set();
  const out = [];

  while (stack.length) {
    const [r, c] = stack.pop();
    const key = `${r},${c}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push([r, c]);

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (!inBounds(board.length, nr, nc)) continue;
      if (board[nr][nc] === color) stack.push([nr, nc]);
    }
  }

  return out;
}

function liberties(board, group) {
  const lib = new Set();
  for (const [r, c] of group) {
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (!inBounds(board.length, nr, nc)) continue;
      if (board[nr][nc] === null) lib.add(`${nr},${nc}`);
    }
  }
  return lib.size;
}

function removeGroup(board, group) {
  for (const [r, c] of group) board[r][c] = null;
  return group.length;
}

function createGameState(size) {
  return {
    size,
    board: createEmptyBoard(size),
    turn: "B",
    captures: { B: 0, W: 0 },
    lastMove: null,
    koPoint: null,
    previousBoardHash: null,
    passCount: 0,
    moveNumber: 0,
    gameOver: false,
    winner: null,
    moves: []
  };
}

function playMove(state, row, col) {
  if (state.gameOver) return { ok: false, message: "對局已結束" };
  if (!inBounds(state.size, row, col)) return { ok: false, message: "超出棋盤" };
  if (state.board[row][col] !== null) return { ok: false, message: "已有棋子" };
  if (state.koPoint && state.koPoint.row === row && state.koPoint.col === col) return { ok: false, message: "Ko 禁著" };

  const currentHash = boardHash(state.board);
  const board = cloneBoard(state.board);
  board[row][col] = state.turn;

  const enemy = opposite(state.turn);
  let captured = 0;
  let koCandidate = null;

  for (const [dr, dc] of dirs) {
    const nr = row + dr;
    const nc = col + dc;
    if (!inBounds(state.size, nr, nc)) continue;
    if (board[nr][nc] !== enemy) continue;

    const group = getGroup(board, nr, nc);
    if (liberties(board, group) === 0) {
      if (group.length === 1) koCandidate = { row: group[0][0], col: group[0][1] };
      captured += removeGroup(board, group);
    }
  }

  const mine = getGroup(board, row, col);
  if (liberties(board, mine) === 0) return { ok: false, message: "禁止自殺手" };

  const nextHash = boardHash(board);
  if (state.previousBoardHash && state.previousBoardHash === nextHash) {
    return { ok: false, message: "違反 Ko" };
  }

  const next = {
    ...state,
    board,
    turn: enemy,
    captures: { ...state.captures, [state.turn]: state.captures[state.turn] + captured },
    lastMove: { row, col },
    koPoint: captured === 1 && mine.length === 1 ? koCandidate : null,
    previousBoardHash: currentHash,
    passCount: 0,
    moveNumber: state.moveNumber + 1,
    moves: [...state.moves, { color: state.turn, row, col }]
  };

  return { ok: true, state: next };
}

function passTurn(state) {
  const nextPass = state.passCount + 1;
  const next = {
    ...state,
    turn: opposite(state.turn),
    passCount: nextPass,
    moveNumber: state.moveNumber + 1,
    koPoint: null,
    lastMove: null,
    previousBoardHash: boardHash(state.board),
    moves: [...state.moves, { color: state.turn, pass: true }]
  };

  if (nextPass >= 2) {
    next.gameOver = true;
  }
  return next;
}

function initWsServer(server) {
  const wss = new WebSocketServer({ server });
  const rooms = new Map();

  function ensureRoom(roomId, size = 19) {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        roomId,
        players: { B: null, W: null },
        spectators: new Set(),
        state: createGameState(size)
      });
    }
    return rooms.get(roomId);
  }

  function send(ws, payload) {
    if (ws && ws.readyState === 1) ws.send(JSON.stringify(payload));
  }

  function broadcastRoom(room) {
    const payload = { type: "room_state", roomId: room.roomId, state: room.state };
    send(room.players.B, payload);
    send(room.players.W, payload);
    room.spectators.forEach((s) => send(s, payload));
  }

  wss.on("connection", (ws) => {
    send(ws, { type: "info", message: "WebSocket 已連線" });

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        const roomId = msg.roomId || "public-room";
        const room = ensureRoom(roomId, msg.size || 19);

        if (msg.type === "join_room") {
          let color = null;
          if (!room.players.B) {
            room.players.B = ws;
            color = "B";
          } else if (!room.players.W) {
            room.players.W = ws;
            color = "W";
          } else {
            room.spectators.add(ws);
          }

          ws.roomId = roomId;
          ws.role = color || "S";
          send(ws, { type: "info", message: color ? `加入房間 ${roomId}，執 ${color}` : `房間 ${roomId} 已滿，轉為觀戰` });
          broadcastRoom(room);
          return;
        }

        if (msg.type === "spectate") {
          room.spectators.add(ws);
          ws.roomId = roomId;
          ws.role = "S";
          send(ws, { type: "info", message: `觀戰 ${roomId}` });
          broadcastRoom(room);
          return;
        }

        if (msg.type === "move") {
          const role = ws.role;
          if (role !== room.state.turn) {
            send(ws, { type: "info", message: "尚未輪到你" });
            return;
          }

          const result = playMove(room.state, Number(msg.row), Number(msg.col));
          if (!result.ok) {
            send(ws, { type: "info", message: result.message });
            return;
          }

          room.state = result.state;
          broadcastRoom(room);
          return;
        }

        if (msg.type === "pass") {
          const role = ws.role;
          if (role !== room.state.turn) {
            send(ws, { type: "info", message: "尚未輪到你" });
            return;
          }

          room.state = passTurn(room.state);
          broadcastRoom(room);
        }
      } catch (error) {
        send(ws, { type: "info", message: `訊息錯誤：${error.message}` });
      }
    });

    ws.on("close", () => {
      rooms.forEach((room) => {
        if (room.players.B === ws) room.players.B = null;
        if (room.players.W === ws) room.players.W = null;
        room.spectators.delete(ws);
      });
    });
  });
}

module.exports = {
  initWsServer
};
