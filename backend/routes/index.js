// ─── Route Aggregator ────────────────────────────────
// Mounts all route modules under their respective prefixes.

const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth.routes"));
router.use("/users", require("./user.routes"));
router.use("/departments", require("./department.routes"));
router.use("/categories", require("./category.routes"));
router.use("/assets", require("./asset.routes"));
router.use("/allocation", require("./allocation.routes"));
router.use("/booking", require("./booking.routes"));
router.use("/maintenance", require("./maintenance.routes"));
router.use("/audit", require("./audit.routes"));
router.use("/notifications", require("./notification.routes"));
router.use("/reports", require("./report.routes"));

module.exports = router;
