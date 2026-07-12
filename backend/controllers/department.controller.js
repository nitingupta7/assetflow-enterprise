// ─── Department Controller ───────────────────────────
const prisma = require("../config/db");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/helpers");

// ─── POST /api/departments ───────────────────────────
const createDepartment = asyncHandler(async (req, res) => {
  const { name, description, headId } = req.body;

  if (!name) throw new ApiError(400, "Department name is required.");

  const existing = await prisma.department.findUnique({ where: { name: name.trim() } });
  if (existing) throw new ApiError(409, "Department already exists.");

  if (headId) {
    const head = await prisma.user.findUnique({ where: { id: parseInt(headId) } });
    if (!head) throw new ApiError(404, "Head user not found.");
  }

  const department = await prisma.department.create({
    data: {
      name: name.trim(),
      description: description || null,
      headId: headId ? parseInt(headId) : null,
    },
    include: { head: { select: { id: true, name: true, email: true } } },
  });

  sendSuccess(res, { department }, "Department created.", 201);
});

// ─── GET /api/departments ────────────────────────────
const getDepartments = asyncHandler(async (req, res) => {
  const departments = await prisma.department.findMany({
    include: {
      head: { select: { id: true, name: true, email: true } },
      _count: { select: { users: true, assets: true } },
    },
    orderBy: { name: "asc" },
  });

  sendSuccess(res, { departments });
});

// ─── PATCH /api/departments/:id ──────────────────────
const updateDepartment = asyncHandler(async (req, res) => {
  const { name, description, headId } = req.body;
  const id = parseInt(req.params.id);

  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Department not found.");

  if (name && name.trim() !== existing.name) {
    const duplicate = await prisma.department.findUnique({ where: { name: name.trim() } });
    if (duplicate) throw new ApiError(409, "Department name already taken.");
  }

  const department = await prisma.department.update({
    where: { id },
    data: {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description }),
      ...(headId !== undefined && { headId: headId ? parseInt(headId) : null }),
    },
    include: { head: { select: { id: true, name: true, email: true } } },
  });

  sendSuccess(res, { department }, "Department updated.");
});

// ─── DELETE /api/departments/:id ─────────────────────
const deleteDepartment = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  const existing = await prisma.department.findUnique({
    where: { id },
    include: { _count: { select: { users: true, assets: true } } },
  });
  if (!existing) throw new ApiError(404, "Department not found.");

  if (existing._count.users > 0 || existing._count.assets > 0) {
    throw new ApiError(400, "Cannot delete department with assigned users or assets. Reassign them first.");
  }

  await prisma.department.delete({ where: { id } });

  sendSuccess(res, {}, "Department deleted.");
});

module.exports = { createDepartment, getDepartments, updateDepartment, deleteDepartment };
