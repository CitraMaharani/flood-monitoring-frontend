const express = require("express");
const router = express.Router();
const sensor = require("../controllers/sensorController");
const auth = require("../middleware/auth");

router.get("/", auth, sensor.list);

module.exports = router;
