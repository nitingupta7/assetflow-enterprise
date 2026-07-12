// ─── Audit Routes ────────────────────────────────────
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { createAudit, getAudits, updateAudit } = require("../controllers/audit.controller");

router.use(auth); // All audit routes require authentication

router.post("/", authorize("ADMIN", "ASSET_MANAGER"), createAudit);
router.get("/", authorize("ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"), getAudits);
router.patch("/:id", authorize("ADMIN", "ASSET_MANAGER"), updateAudit);

module.exports = router;
