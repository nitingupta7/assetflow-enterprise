// ─── Asset Controller ────────────────────────────────
const prisma = require("../config/db");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/helpers");

// ─── POST /api/assets ────────────────────────────────
const createAsset = asyncHandler(async (req, res) => {
  const { assetTag, assetName, serialNumber, purchaseDate, purchasePrice, location, categoryId, departmentId } = req.body;

  if (!assetTag || !assetName || !categoryId || !departmentId) {
    throw new ApiError(400, "assetTag, assetName, categoryId, and departmentId are required.");
  }

  // Check unique constraints
  const existingTag = await prisma.asset.findUnique({ where: { assetTag } });
  if (existingTag) throw new ApiError(409, "Asset tag already exists.");

  if (serialNumber) {
    const existingSerial = await prisma.asset.findUnique({ where: { serialNumber } });
    if (existingSerial) throw new ApiError(409, "Serial number already exists.");
  }

  // Verify category and department exist
  const category = await prisma.category.findUnique({ where: { id: parseInt(categoryId) } });
  if (!category) throw new ApiError(404, "Category not found.");

  const department = await prisma.department.findUnique({ where: { id: parseInt(departmentId) } });
  if (!department) throw new ApiError(404, "Department not found.");

  const asset = await prisma.asset.create({
    data: {
      assetTag: assetTag.trim(),
      assetName: assetName.trim(),
      serialNumber: serialNumber || null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
      location: location || null,
      categoryId: parseInt(categoryId),
      departmentId: parseInt(departmentId),
      createdById: req.user.id,
    },
    include: {
      category: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  sendSuccess(res, { asset }, "Asset registered.", 201);
});

// ─── GET /api/assets ─────────────────────────────────
const getAssets = asyncHandler(async (req, res) => {
  const { status, categoryId, departmentId, search, page = 1, limit = 20 } = req.query;

  const where = {};
  if (status) where.status = status;
  if (categoryId) where.categoryId = parseInt(categoryId);
  if (departmentId) where.departmentId = parseInt(departmentId);
  if (search) {
    where.OR = [
      { assetTag: { contains: search } },
      { assetName: { contains: search } },
      { serialNumber: { contains: search } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [assets, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
    }),
    prisma.asset.count({ where }),
  ]);

  sendSuccess(res, {
    assets,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ─── GET /api/assets/:id ─────────────────────────────
const getAssetById = asyncHandler(async (req, res) => {
  const asset = await prisma.asset.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      category: true,
      department: true,
      createdBy: { select: { id: true, name: true, email: true } },
      allocations: {
        include: { employee: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      bookings: {
        include: { requestedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      maintenance: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!asset) throw new ApiError(404, "Asset not found.");

  sendSuccess(res, { asset });
});

// ─── PATCH /api/assets/:id ───────────────────────────
const updateAsset = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { assetName, serialNumber, purchaseDate, purchasePrice, status, location, categoryId, departmentId } = req.body;

  const existing = await prisma.asset.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Asset not found.");

  // Check serial number uniqueness if being changed
  if (serialNumber && serialNumber !== existing.serialNumber) {
    const duplicate = await prisma.asset.findUnique({ where: { serialNumber } });
    if (duplicate) throw new ApiError(409, "Serial number already in use.");
  }

  const asset = await prisma.asset.update({
    where: { id },
    data: {
      ...(assetName && { assetName: assetName.trim() }),
      ...(serialNumber !== undefined && { serialNumber: serialNumber || null }),
      ...(purchaseDate !== undefined && { purchaseDate: purchaseDate ? new Date(purchaseDate) : null }),
      ...(purchasePrice !== undefined && { purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null }),
      ...(status && { status }),
      ...(location !== undefined && { location }),
      ...(categoryId && { categoryId: parseInt(categoryId) }),
      ...(departmentId && { departmentId: parseInt(departmentId) }),
    },
    include: {
      category: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
    },
  });

  sendSuccess(res, { asset }, "Asset updated.");
});

// ─── DELETE /api/assets/:id ──────────────────────────
const deleteAsset = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  const existing = await prisma.asset.findUnique({
    where: { id },
    include: { _count: { select: { allocations: true } } },
  });
  if (!existing) throw new ApiError(404, "Asset not found.");

  // Check for active allocations
  const activeAllocations = await prisma.allocation.count({
    where: { assetId: id, status: "ACTIVE" },
  });
  if (activeAllocations > 0) {
    throw new ApiError(400, "Cannot delete asset with active allocations.");
  }

  await prisma.asset.delete({ where: { id } });

  sendSuccess(res, {}, "Asset deleted.");
});

module.exports = { createAsset, getAssets, getAssetById, updateAsset, deleteAsset };
