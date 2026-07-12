// ─── Allocation Routes ───────────────────────────────
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { createAllocation, getAllocations, returnAllocation, transferAllocation } = require("../controllers/allocation.controller");

router.use(auth); // All allocation routes require authentication

router.post("/", authorize("ADMIN", "ASSET_MANAGER"), createAllocation);
router.get("/", getAllocations); // Employees see their own, managers see all
router.patch("/:id/return", authorize("ADMIN", "ASSET_MANAGER"), returnAllocation);
router.post("/transfer", authorize("ADMIN", "ASSET_MANAGER"), transferAllocation);

module.exports = router;
