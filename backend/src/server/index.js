require("dotenv").config();
const path = require("path");
const http = require("http");
const express = require("express");
const cors = require("cors");
const gameRoute = require("../routes/game");
const tutorialRoute = require("../routes/tutorial");
const puzzleRoute = require("../routes/puzzle");
const { initWsServer } = require("../websocket/wsServer");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "GO backend" });
});

app.use("/api/game", gameRoute);
app.use("/api/tutorial", tutorialRoute);
app.use("/api/puzzle", puzzleRoute);

const frontendDist = path.join(__dirname, "..", "..", "..", "frontend", "dist");
app.use(express.static(frontendDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/health")) return next();
  res.sendFile(path.join(frontendDist, "index.html"), (err) => {
    if (err) next();
  });
});

initWsServer(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`GO backend running on http://localhost:${PORT}`);
});
