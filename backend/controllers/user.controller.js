// ─── User Controller ─────────────────────────────────
const prisma = require("../config/db");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, excludeFields } = require("../utils/helpers");

// ─── GET /api/users ──────────────────────────────────
const getUsers = asyncHandler(async (req, res) => {
  const { role, departmentId, isActive, search, page = 1, limit = 20 } = req.query;

  const where = {};
  if (role) where.role = role;
  if (departmentId) where.departmentId = parseInt(departmentId);
  if (isActive !== undefined) where.isActive = isActive === "true";
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { department: { select: { id: true, name: true } } },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  const safeUsers = users.map((u) => excludeFields(u, ["password"]));

  sendSuccess(res, {
    users: safeUsers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ─── GET /api/users/:id ──────────────────────────────
const getUserById = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      department: true,
      allocationsReceived: { take: 5, orderBy: { createdAt: "desc" } },
      bookingsRequested: { take: 5, orderBy: { createdAt: "desc" } },
    },
  });

  if (!user) throw new ApiError(404, "User not found.");

  sendSuccess(res, { user: excludeFields(user, ["password"]) });
});

// ─── PATCH /api/users/:id ────────────────────────────
const updateUser = asyncHandler(async (req, res) => {
  const { name, phone, departmentId, isActive } = req.body;
  const id = parseInt(req.params.id);

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "User not found.");

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(name && { name: name.trim() }),
      ...(phone !== undefined && { phone }),
      ...(departmentId !== undefined && { departmentId: departmentId ? parseInt(departmentId) : null }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  sendSuccess(res, { user: excludeFields(user, ["password"]) }, "User updated.");
});

// ─── DELETE /api/users/:id (soft delete) ─────────────
const deleteUser = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "User not found.");

  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  sendSuccess(res, {}, "User deactivated.");
});

// ─── PATCH /api/users/:id/role ───────────────────────
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const id = parseInt(req.params.id);

  const validRoles = ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"];
  if (!role || !validRoles.includes(role)) {
    throw new ApiError(400, `Invalid role. Must be one of: ${validRoles.join(", ")}`);
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "User not found.");

  const user = await prisma.user.update({
    where: { id },
    data: { role },
  });

  sendSuccess(res, { user: excludeFields(user, ["password"]) }, "Role updated.");
});

module.exports = { getUsers, getUserById, updateUser, deleteUser, updateUserRole };
