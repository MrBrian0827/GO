const express = require("express");

const router = express.Router();

router.post("/", (req, res) => {
  const { password } = req.body;
  const expected = process.env.GAME_PVP_PASSWORD || "";
  if (!expected) {
    return res.status(500).json({ ok: false, error: "PVP password not configured" });
  }
  if (password !== expected) {
    return res.status(401).json({ ok: false, error: "Invalid password" });
  }
  return res.json({ ok: true });
});

module.exports = router;
