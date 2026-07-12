// ─── Audit Controller ────────────────────────────────
const prisma = require("../config/db");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/helpers");

// ─── POST /api/audit ─────────────────────────────────
const createAudit = asyncHandler(async (req, res) => {
  const { departmentId, assetId, expectedLocation, actualLocation, status, remarks } = req.body;

  if (!departmentId || !assetId) {
    throw new ApiError(400, "departmentId and assetId are required.");
  }

  // Verify department and asset exist
  const department = await prisma.department.findUnique({ where: { id: parseInt(departmentId) } });
  if (!department) throw new ApiError(404, "Department not found.");

  const asset = await prisma.asset.findUnique({ where: { id: parseInt(assetId) } });
  if (!asset) throw new ApiError(404, "Asset not found.");

  const audit = await prisma.audit.create({
    data: {
      departmentId: parseInt(departmentId),
      auditorId: req.user.id,
      assetId: parseInt(assetId),
      expectedLocation: expectedLocation || null,
      actualLocation: actualLocation || null,
      status: status || "PENDING",
      remarks: remarks || null,
    },
    include: {
      department: { select: { id: true, name: true } },
      auditor: { select: { id: true, name: true } },
      asset: { select: { id: true, assetTag: true, assetName: true } },
    },
  });

  sendSuccess(res, { audit }, "Audit record created.", 201);
});

// ─── GET /api/audit ──────────────────────────────────
const getAudits = asyncHandler(async (req, res) => {
  const { departmentId, status, assetId, page = 1, limit = 20 } = req.query;

  const where = {};
  if (departmentId) where.departmentId = parseInt(departmentId);
  if (status) where.status = status;
  if (assetId) where.assetId = parseInt(assetId);

  // Department heads see only their department audits
  if (req.user.role === "DEPARTMENT_HEAD" && req.user.departmentId) {
    where.departmentId = req.user.departmentId;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [audits, total] = await Promise.all([
    prisma.audit.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        auditor: { select: { id: true, name: true } },
        asset: { select: { id: true, assetTag: true, assetName: true, location: true } },
      },
      skip,
      take: parseInt(limit),
      orderBy: { auditDate: "desc" },
    }),
    prisma.audit.count({ where }),
  ]);

  sendSuccess(res, {
    audits,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ─── PATCH /api/audit/:id ────────────────────────────
const updateAudit = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { actualLocation, status, remarks } = req.body;

  const existing = await prisma.audit.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Audit record not found.");

  const audit = await prisma.audit.update({
    where: { id },
    data: {
      ...(actualLocation !== undefined && { actualLocation }),
      ...(status && { status }),
      ...(remarks !== undefined && { remarks }),
    },
    include: {
      department: { select: { id: true, name: true } },
      auditor: { select: { id: true, name: true } },
      asset: { select: { id: true, assetTag: true, assetName: true } },
    },
  });

  sendSuccess(res, { audit }, "Audit updated.");
});

module.exports = { createAudit, getAudits, updateAudit };
