// ─── Booking Routes ──────────────────────────────────
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { createBooking, getBookings, approveBooking, rejectBooking } = require("../controllers/booking.controller");

router.use(auth); // All booking routes require authentication

router.post("/", createBooking); // Any authenticated user can book
router.get("/", getBookings);    // Employees see their own, managers see all
router.patch("/:id/approve", authorize("ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"), approveBooking);
router.patch("/:id/reject", authorize("ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"), rejectBooking);

module.exports = router;
