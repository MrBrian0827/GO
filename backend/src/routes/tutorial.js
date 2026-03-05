const express = require("express");
const { listTutorials } = require("../controllers/tutorialController");

const router = express.Router();
router.get("/", listTutorials);

module.exports = router;
