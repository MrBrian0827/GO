const { spawn } = require("child_process");
const fs = require("fs");

function toGtpCoord(size, row, col) {
  const letters = "ABCDEFGHJKLMNOPQRST";
  const letter = letters[col];
  const gtpRow = size - row;
  return `${letter}${gtpRow}`;
}

function fromGtpCoord(size, coord) {
  if (!coord || coord.toLowerCase() === "pass") return { pass: true };
  const letters = "ABCDEFGHJKLMNOPQRST";
  const col = letters.indexOf(coord[0].toUpperCase());
  const gtpRow = Number(coord.slice(1));
  if (col < 0 || !gtpRow) return null;
  const row = size - gtpRow;
  return { row, col };
}

function ensureFileExists(label, filePath) {
  if (!filePath) return null;
  if (!fs.existsSync(filePath)) {
    const message = `${label} not found: ${filePath}`;
    console.error(`[AI] ${message}`);
    return message;
  }
  return null;
}

function runGtp(commands, timeoutMs) {
  return new Promise((resolve, reject) => {
    const kataBin = process.env.KATAGO_BIN;
    const kataModel = process.env.KATAGO_MODEL;
    const kataConfig = process.env.KATAGO_CONFIG;
    const leelaBin = process.env.LEELA_BIN;
    const leelaWeights = process.env.LEELA_WEIGHTS;

    let bin = null;
    let args = [];
    let engine = "";
    let precheckError = null;

    if (kataBin && kataModel) {
      engine = "KataGo";
      bin = kataBin;
      args = ["gtp", "-model", kataModel];
      if (kataConfig) args.push("-config", kataConfig);
      precheckError =
        ensureFileExists("KATAGO_BIN", kataBin) ||
        ensureFileExists("KATAGO_MODEL", kataModel) ||
        (kataConfig ? ensureFileExists("KATAGO_CONFIG", kataConfig) : null);
    } else if (leelaBin && leelaWeights) {
      engine = "LeelaZero";
      bin = leelaBin;
      args = ["-g", "-w", leelaWeights];
      precheckError = ensureFileExists("LEELA_BIN", leelaBin) || ensureFileExists("LEELA_WEIGHTS", leelaWeights);
    } else {
      const message = "KATAGO_BIN/KATAGO_MODEL or LEELA_BIN/LEELA_WEIGHTS not set";
      console.error(`[AI] ${message}`);
      reject(new Error(message));
      return;
    }

    if (precheckError) {
      reject(new Error(precheckError));
      return;
    }

    console.log(`[AI] start ${engine}`, { bin, args });

    const proc = spawn(bin, args, { stdio: ["pipe", "pipe", "pipe"] });
    const out = [];
    const err = [];

    const timer = setTimeout(() => {
      console.error("[AI] engine timeout, killing process");
      proc.kill("SIGKILL");
      reject(new Error("GTP engine timeout"));
    }, timeoutMs);

    proc.stdout.on("data", (data) => {
      const text = data.toString();
      out.push(text);
      console.log(`[AI][stdout] ${text.trim()}`);
    });

    proc.stderr.on("data", (data) => {
      const text = data.toString();
      err.push(text);
      console.error(`[AI][stderr] ${text.trim()}`);
    });

    proc.on("error", (e) => {
      clearTimeout(timer);
      console.error(`[AI] engine spawn error: ${e.message}`);
      reject(e);
    });

    proc.on("close", (code) => {
      clearTimeout(timer);
      console.log(`[AI] engine closed with code ${code}`);
      if (code !== 0 && err.length) {
        reject(new Error(err.join("")));
        return;
      }
      resolve(out.join(""));
    });

    proc.stdin.write(commands.join("\n") + "\n");
  });
}

async function getAIMove(req, res) {
  try {
    const { size, moves, toPlay } = req.body;
    if (!size || !Array.isArray(moves)) return res.status(400).json({ error: "Invalid payload" });

    console.log("[AI] request", {
      size,
      toPlay,
      moves: moves.length,
      lastMove: moves[moves.length - 1] || null
    });

    const commands = [`boardsize ${size}`, "clear_board", "komi 7.5"];
    for (const mv of moves) {
      if (mv.pass) {
        commands.push(`play ${mv.color} pass`);
        continue;
      }
      if (typeof mv.row !== "number" || typeof mv.col !== "number") continue;
      commands.push(`play ${mv.color} ${toGtpCoord(size, mv.row, mv.col)}`);
    }

    commands.push(`genmove ${toPlay}`);
    commands.push("quit");

    const output = await runGtp(commands, 6000);
    const lines = output.split(/\r?\n/).filter(Boolean);
    const genLine = lines.find((l) => l.startsWith("=") && l.length > 1);
    if (!genLine) {
      console.error("[AI] no genmove response", { output });
      return res.status(500).json({ error: "GTP engine no response" });
    }

    const moveText = genLine.replace(/^=\s*/, "").trim();
    const move = fromGtpCoord(size, moveText);
    if (!move) {
      console.error("[AI] invalid move text", { moveText });
      return res.status(500).json({ error: "Invalid move from engine" });
    }

    console.log("[AI] response", { moveText, move });
    return res.json({ move });
  } catch (error) {
    console.error(`[AI] error: ${error.message}`);
    return res.status(500).json({ error: error.message || "GTP engine error" });
  }
}

module.exports = { getAIMove };
