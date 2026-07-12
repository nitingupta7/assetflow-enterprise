// ─── Report Routes ───────────────────────────────────
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { getDashboard, getUtilization, exportReport } = require("../controllers/report.controller");

router.use(auth); // All report routes require authentication

router.get("/dashboard", authorize("ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"), getDashboard);
router.get("/utilization", authorize("ADMIN", "ASSET_MANAGER"), getUtilization);
router.get("/export", authorize("ADMIN", "ASSET_MANAGER"), exportReport);

module.exports = router;
