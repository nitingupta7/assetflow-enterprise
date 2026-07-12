// ─── Maintenance Routes ──────────────────────────────
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { createMaintenance, getMaintenanceRecords, updateMaintenance } = require("../controllers/maintenance.controller");

router.use(auth); // All maintenance routes require authentication

router.post("/", createMaintenance); // Any authenticated user can report
router.get("/", getMaintenanceRecords); // Employees see their own, managers see all
router.patch("/:id", authorize("ADMIN", "ASSET_MANAGER"), updateMaintenance);

module.exports = router;
