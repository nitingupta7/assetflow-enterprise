// ─── Maintenance Controller ──────────────────────────
const prisma = require("../config/db");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/helpers");
const { createNotification } = require("../services/notification.service");

// ─── POST /api/maintenance ───────────────────────────
const createMaintenance = asyncHandler(async (req, res) => {
  const { assetId, issue } = req.body;

  if (!assetId || !issue) {
    throw new ApiError(400, "assetId and issue description are required.");
  }

  const asset = await prisma.asset.findUnique({ where: { id: parseInt(assetId) } });
  if (!asset) throw new ApiError(404, "Asset not found.");

  const maintenance = await prisma.maintenance.create({
    data: {
      assetId: parseInt(assetId),
      reportedById: req.user.id,
      issue: issue.trim(),
    },
    include: {
      asset: { select: { id: true, assetTag: true, assetName: true } },
      reportedBy: { select: { id: true, name: true } },
    },
  });

  sendSuccess(res, { maintenance }, "Maintenance request created.", 201);
});

// ─── GET /api/maintenance ────────────────────────────
const getMaintenanceRecords = asyncHandler(async (req, res) => {
  const { status, assetId, page = 1, limit = 20 } = req.query;

  const where = {};
  if (status) where.status = status;
  if (assetId) where.assetId = parseInt(assetId);

  // Employees see only their reported issues
  if (req.user.role === "EMPLOYEE") {
    where.reportedById = req.user.id;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [records, total] = await Promise.all([
    prisma.maintenance.findMany({
      where,
      include: {
        asset: { select: { id: true, assetTag: true, assetName: true } },
        reportedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
    }),
    prisma.maintenance.count({ where }),
  ]);

  sendSuccess(res, {
    maintenance: records,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ─── PATCH /api/maintenance/:id ──────────────────────
const updateMaintenance = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { status, technician, cost, startDate, endDate } = req.body;

  const existing = await prisma.maintenance.findUnique({
    where: { id },
    include: { asset: true },
  });
  if (!existing) throw new ApiError(404, "Maintenance record not found.");

  const updateData = {};
  if (status) updateData.status = status;
  if (technician !== undefined) updateData.technician = technician;
  if (cost !== undefined) updateData.cost = cost ? parseFloat(cost) : null;
  if (startDate) updateData.startDate = new Date(startDate);
  if (endDate) updateData.endDate = new Date(endDate);

  // Track approver when status changes from REPORTED
  if (status && status !== "REPORTED" && existing.status === "REPORTED") {
    updateData.approvedById = req.user.id;
  }

  // Update asset status based on maintenance status
  if (status === "IN_PROGRESS" || status === "APPROVED") {
    await prisma.asset.update({
      where: { id: existing.assetId },
      data: { status: "MAINTENANCE" },
    });
  }
  if (status === "COMPLETED") {
    await prisma.asset.update({
      where: { id: existing.assetId },
      data: { status: "AVAILABLE" },
    });
  }

  const maintenance = await prisma.maintenance.update({
    where: { id },
    data: updateData,
    include: {
      asset: { select: { id: true, assetTag: true, assetName: true } },
      reportedBy: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } },
    },
  });

  // Notify the reporter about status changes
  await createNotification(
    existing.reportedById,
    "Maintenance Update",
    `Maintenance for "${existing.asset.assetName}" is now: ${status}.`,
    "MAINTENANCE"
  );

  sendSuccess(res, { maintenance }, "Maintenance updated.");
});

module.exports = { createMaintenance, getMaintenanceRecords, updateMaintenance };
