// ─── Booking Controller ──────────────────────────────
const prisma = require("../config/db");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/helpers");
const { createNotification } = require("../services/notification.service");

// ─── POST /api/booking ───────────────────────────────
const createBooking = asyncHandler(async (req, res) => {
  const { assetId, startTime, endTime } = req.body;

  if (!assetId || !startTime || !endTime) {
    throw new ApiError(400, "assetId, startTime, and endTime are required.");
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (start >= end) {
    throw new ApiError(400, "startTime must be before endTime.");
  }

  if (start < new Date()) {
    throw new ApiError(400, "Cannot book in the past.");
  }

  // Verify asset exists
  const asset = await prisma.asset.findUnique({ where: { id: parseInt(assetId) } });
  if (!asset) throw new ApiError(404, "Asset not found.");

  // Check for overlapping approved bookings
  const overlapping = await prisma.booking.findFirst({
    where: {
      assetId: parseInt(assetId),
      status: "APPROVED",
      startTime: { lt: end },
      endTime: { gt: start },
    },
  });
  if (overlapping) {
    throw new ApiError(409, "This asset is already booked for the requested time slot.");
  }

  const booking = await prisma.booking.create({
    data: {
      assetId: parseInt(assetId),
      requestedById: req.user.id,
      startTime: start,
      endTime: end,
    },
    include: {
      asset: { select: { id: true, assetTag: true, assetName: true } },
      requestedBy: { select: { id: true, name: true, email: true } },
    },
  });

  sendSuccess(res, { booking }, "Booking request submitted.", 201);
});

// ─── GET /api/booking ────────────────────────────────
const getBookings = asyncHandler(async (req, res) => {
  const { status, assetId, page = 1, limit = 20 } = req.query;

  const where = {};
  if (status) where.status = status;
  if (assetId) where.assetId = parseInt(assetId);

  // Employees see only their bookings
  if (req.user.role === "EMPLOYEE") {
    where.requestedById = req.user.id;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        asset: { select: { id: true, assetTag: true, assetName: true } },
        requestedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      skip,
      take: parseInt(limit),
      orderBy: { bookingDate: "desc" },
    }),
    prisma.booking.count({ where }),
  ]);

  sendSuccess(res, {
    bookings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ─── PATCH /api/booking/:id/approve ──────────────────
const approveBooking = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { asset: true },
  });
  if (!booking) throw new ApiError(404, "Booking not found.");
  if (booking.status !== "PENDING") {
    throw new ApiError(400, `Booking is already ${booking.status}.`);
  }

  const updatedBooking = await prisma.booking.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedById: req.user.id,
    },
    include: {
      asset: { select: { id: true, assetTag: true, assetName: true } },
      requestedBy: { select: { id: true, name: true } },
    },
  });

  await createNotification(
    booking.requestedById,
    "Booking Approved",
    `Your booking for "${booking.asset.assetName}" (${booking.asset.assetTag}) has been approved.`,
    "BOOKING"
  );

  sendSuccess(res, { booking: updatedBooking }, "Booking approved.");
});

// ─── PATCH /api/booking/:id/reject ───────────────────
const rejectBooking = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { asset: true },
  });
  if (!booking) throw new ApiError(404, "Booking not found.");
  if (booking.status !== "PENDING") {
    throw new ApiError(400, `Booking is already ${booking.status}.`);
  }

  const updatedBooking = await prisma.booking.update({
    where: { id },
    data: {
      status: "REJECTED",
      approvedById: req.user.id,
    },
    include: {
      asset: { select: { id: true, assetTag: true, assetName: true } },
      requestedBy: { select: { id: true, name: true } },
    },
  });

  await createNotification(
    booking.requestedById,
    "Booking Rejected",
    `Your booking for "${booking.asset.assetName}" (${booking.asset.assetTag}) has been rejected.`,
    "BOOKING"
  );

  sendSuccess(res, { booking: updatedBooking }, "Booking rejected.");
});

module.exports = { createBooking, getBookings, approveBooking, rejectBooking };
