// ─── Notification Routes ─────────────────────────────
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getNotifications, markAllAsRead } = require("../controllers/notification.controller");

router.use(auth); // All notification routes require authentication

router.get("/", getNotifications);
router.patch("/read", markAllAsRead);

module.exports = router;
