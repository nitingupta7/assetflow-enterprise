// ─── Category Controller ─────────────────────────────
const prisma = require("../config/db");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/helpers");

// ─── POST /api/categories ────────────────────────────
const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) throw new ApiError(400, "Category name is required.");

  const existing = await prisma.category.findUnique({ where: { name: name.trim() } });
  if (existing) throw new ApiError(409, "Category already exists.");

  const category = await prisma.category.create({
    data: {
      name: name.trim(),
      description: description || null,
    },
  });

  sendSuccess(res, { category }, "Category created.", 201);
});

// ─── GET /api/categories ─────────────────────────────
const getCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { assets: true } } },
    orderBy: { name: "asc" },
  });

  sendSuccess(res, { categories });
});

// ─── PATCH /api/categories/:id ───────────────────────
const updateCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const id = parseInt(req.params.id);

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Category not found.");

  if (name && name.trim() !== existing.name) {
    const duplicate = await prisma.category.findUnique({ where: { name: name.trim() } });
    if (duplicate) throw new ApiError(409, "Category name already taken.");
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description }),
    },
  });

  sendSuccess(res, { category }, "Category updated.");
});

// ─── DELETE /api/categories/:id ──────────────────────
const deleteCategory = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { assets: true } } },
  });
  if (!existing) throw new ApiError(404, "Category not found.");

  if (existing._count.assets > 0) {
    throw new ApiError(400, "Cannot delete category with assigned assets. Reassign them first.");
  }

  await prisma.category.delete({ where: { id } });

  sendSuccess(res, {}, "Category deleted.");
});

module.exports = { createCategory, getCategories, updateCategory, deleteCategory };
