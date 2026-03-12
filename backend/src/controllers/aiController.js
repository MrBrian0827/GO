const { spawn } = require("child_process");

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

function runGtp(commands, timeoutMs) {
  return new Promise((resolve, reject) => {
    const kataBin = process.env.KATAGO_BIN;
    const kataModel = process.env.KATAGO_MODEL;
    const kataConfig = process.env.KATAGO_CONFIG;
    const leelaBin = process.env.LEELA_BIN;
    const leelaWeights = process.env.LEELA_WEIGHTS;

    let bin = null;
    let args = [];

    if (kataBin && kataModel) {
      bin = kataBin;
      args = ["gtp", "-model", kataModel];
      if (kataConfig) args.push("-config", kataConfig);
    } else if (leelaBin && leelaWeights) {
      bin = leelaBin;
      args = ["-g", "-w", leelaWeights];
    } else {
      reject(new Error("KATAGO_BIN/KATAGO_MODEL or LEELA_BIN/LEELA_WEIGHTS not set"));
      return;
    }

    const proc = spawn(bin, args, { stdio: ["pipe", "pipe", "pipe"] });
    const out = [];
    const err = [];

    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(new Error("GTP engine timeout"));
    }, timeoutMs);

    proc.stdout.on("data", (data) => out.push(data.toString()));
    proc.stderr.on("data", (data) => err.push(data.toString()));

    proc.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });

    proc.on("close", (code) => {
      clearTimeout(timer);
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
    if (!genLine) return res.status(500).json({ error: "GTP engine no response" });

    const moveText = genLine.replace(/^=\s*/, "").trim();
    const move = fromGtpCoord(size, moveText);
    if (!move) return res.status(500).json({ error: "Invalid move from engine" });

    return res.json({ move });
  } catch (error) {
    return res.status(500).json({ error: error.message || "GTP engine error" });
  }
}

module.exports = { getAIMove };

