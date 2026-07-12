// ─── Allocation Controller ───────────────────────────
const prisma = require("../config/db");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/helpers");
const { createNotification } = require("../services/notification.service");

// ─── POST /api/allocation ────────────────────────────
const createAllocation = asyncHandler(async (req, res) => {
  const { assetId, employeeId, reason } = req.body;

  if (!assetId || !employeeId) {
    throw new ApiError(400, "assetId and employeeId are required.");
  }

  // Verify asset exists and is available
  const asset = await prisma.asset.findUnique({ where: { id: parseInt(assetId) } });
  if (!asset) throw new ApiError(404, "Asset not found.");
  if (asset.status !== "AVAILABLE") {
    throw new ApiError(400, `Asset is currently ${asset.status} and cannot be allocated.`);
  }

  // Verify employee exists
  const employee = await prisma.user.findUnique({ where: { id: parseInt(employeeId) } });
  if (!employee) throw new ApiError(404, "Employee not found.");
  if (!employee.isActive) throw new ApiError(400, "Employee is deactivated.");

  // Create allocation and update asset status in a transaction
  const [allocation] = await prisma.$transaction([
    prisma.allocation.create({
      data: {
        assetId: parseInt(assetId),
        employeeId: parseInt(employeeId),
        allocatedById: req.user.id,
        reason: reason || null,
      },
      include: {
        asset: { select: { id: true, assetTag: true, assetName: true } },
        employee: { select: { id: true, name: true, email: true } },
        allocatedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.asset.update({
      where: { id: parseInt(assetId) },
      data: { status: "ALLOCATED" },
    }),
  ]);

  // Notify employee
  await createNotification(
    parseInt(employeeId),
    "Asset Allocated",
    `Asset "${asset.assetName}" (${asset.assetTag}) has been allocated to you.`,
    "ALLOCATION"
  );

  sendSuccess(res, { allocation }, "Asset allocated successfully.", 201);
});

// ─── GET /api/allocation ─────────────────────────────
const getAllocations = asyncHandler(async (req, res) => {
  const { status, employeeId, assetId, page = 1, limit = 20 } = req.query;

  const where = {};
  if (status) where.status = status;
  if (employeeId) where.employeeId = parseInt(employeeId);
  if (assetId) where.assetId = parseInt(assetId);

  // Non-admin users can only see their own allocations
  if (req.user.role === "EMPLOYEE") {
    where.employeeId = req.user.id;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [allocations, total] = await Promise.all([
    prisma.allocation.findMany({
      where,
      include: {
        asset: { select: { id: true, assetTag: true, assetName: true, status: true } },
        employee: { select: { id: true, name: true, email: true } },
        allocatedBy: { select: { id: true, name: true } },
      },
      skip,
      take: parseInt(limit),
      orderBy: { allocatedDate: "desc" },
    }),
    prisma.allocation.count({ where }),
  ]);

  sendSuccess(res, {
    allocations,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ─── PATCH /api/allocation/:id/return ────────────────
const returnAllocation = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  const allocation = await prisma.allocation.findUnique({
    where: { id },
    include: { asset: true },
  });
  if (!allocation) throw new ApiError(404, "Allocation not found.");
  if (allocation.status !== "ACTIVE") {
    throw new ApiError(400, "This allocation is not active.");
  }

  const [updatedAllocation] = await prisma.$transaction([
    prisma.allocation.update({
      where: { id },
      data: {
        status: "RETURNED",
        returnedDate: new Date(),
      },
      include: {
        asset: { select: { id: true, assetTag: true, assetName: true } },
        employee: { select: { id: true, name: true } },
      },
    }),
    prisma.asset.update({
      where: { id: allocation.assetId },
      data: { status: "AVAILABLE" },
    }),
  ]);

  // Notify employee
  await createNotification(
    allocation.employeeId,
    "Asset Returned",
    `Asset "${allocation.asset.assetName}" (${allocation.asset.assetTag}) has been returned.`,
    "ALLOCATION"
  );

  sendSuccess(res, { allocation: updatedAllocation }, "Asset returned.");
});

// ─── POST /api/allocation/transfer ───────────────────
const transferAllocation = asyncHandler(async (req, res) => {
  const { allocationId, newEmployeeId, reason } = req.body;

  if (!allocationId || !newEmployeeId) {
    throw new ApiError(400, "allocationId and newEmployeeId are required.");
  }

  const currentAllocation = await prisma.allocation.findUnique({
    where: { id: parseInt(allocationId) },
    include: { asset: true },
  });
  if (!currentAllocation) throw new ApiError(404, "Allocation not found.");
  if (currentAllocation.status !== "ACTIVE") {
    throw new ApiError(400, "Only active allocations can be transferred.");
  }

  const newEmployee = await prisma.user.findUnique({ where: { id: parseInt(newEmployeeId) } });
  if (!newEmployee) throw new ApiError(404, "New employee not found.");
  if (!newEmployee.isActive) throw new ApiError(400, "New employee is deactivated.");

  // Close current allocation and create new one in transaction
  const [, newAllocation] = await prisma.$transaction([
    prisma.allocation.update({
      where: { id: parseInt(allocationId) },
      data: { status: "TRANSFERRED", returnedDate: new Date() },
    }),
    prisma.allocation.create({
      data: {
        assetId: currentAllocation.assetId,
        employeeId: parseInt(newEmployeeId),
        allocatedById: req.user.id,
        reason: reason || `Transferred from employee #${currentAllocation.employeeId}`,
      },
      include: {
        asset: { select: { id: true, assetTag: true, assetName: true } },
        employee: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  // Notify both employees
  await createNotification(
    currentAllocation.employeeId,
    "Asset Transferred",
    `Asset "${currentAllocation.asset.assetName}" has been transferred to ${newEmployee.name}.`,
    "ALLOCATION"
  );
  await createNotification(
    parseInt(newEmployeeId),
    "Asset Allocated (Transfer)",
    `Asset "${currentAllocation.asset.assetName}" has been transferred to you.`,
    "ALLOCATION"
  );

  sendSuccess(res, { allocation: newAllocation }, "Asset transferred.", 201);
});

module.exports = { createAllocation, getAllocations, returnAllocation, transferAllocation };
