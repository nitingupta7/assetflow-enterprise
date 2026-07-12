// ─── Report Controller ───────────────────────────────
const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/helpers");

// ─── GET /api/reports/dashboard ──────────────────────
const getDashboard = asyncHandler(async (req, res) => {
  const [
    totalAssets,
    availableAssets,
    allocatedAssets,
    maintenanceAssets,
    totalUsers,
    activeBookings,
    pendingMaintenance,
    totalDepartments,
  ] = await Promise.all([
    prisma.asset.count(),
    prisma.asset.count({ where: { status: "AVAILABLE" } }),
    prisma.asset.count({ where: { status: "ALLOCATED" } }),
    prisma.asset.count({ where: { status: "MAINTENANCE" } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.maintenance.count({ where: { status: { in: ["REPORTED", "APPROVED", "IN_PROGRESS"] } } }),
    prisma.department.count(),
  ]);

  // Recent activity — last 10 allocations
  const recentAllocations = await prisma.allocation.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      asset: { select: { assetTag: true, assetName: true } },
      employee: { select: { name: true } },
    },
  });

  sendSuccess(res, {
    stats: {
      totalAssets,
      availableAssets,
      allocatedAssets,
      maintenanceAssets,
      totalUsers,
      activeBookings,
      pendingMaintenance,
      totalDepartments,
    },
    recentAllocations,
  });
});

// ─── GET /api/reports/utilization ────────────────────
const getUtilization = asyncHandler(async (req, res) => {
  // Assets by status
  const assetsByStatus = await prisma.asset.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  // Assets by department
  const assetsByDepartment = await prisma.department.findMany({
    select: {
      id: true,
      name: true,
      _count: { select: { assets: true } },
    },
  });

  // Assets by category
  const assetsByCategory = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      _count: { select: { assets: true } },
    },
  });

  // Most allocated assets (top 10)
  const mostAllocated = await prisma.allocation.groupBy({
    by: ["assetId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  // Enrich with asset details
  const mostAllocatedWithDetails = await Promise.all(
    mostAllocated.map(async (item) => {
      const asset = await prisma.asset.findUnique({
        where: { id: item.assetId },
        select: { assetTag: true, assetName: true },
      });
      return { ...asset, allocationCount: item._count.id };
    })
  );

  sendSuccess(res, {
    assetsByStatus: assetsByStatus.map((s) => ({ status: s.status, count: s._count.id })),
    assetsByDepartment: assetsByDepartment.map((d) => ({ id: d.id, name: d.name, assetCount: d._count.assets })),
    assetsByCategory: assetsByCategory.map((c) => ({ id: c.id, name: c.name, assetCount: c._count.assets })),
    mostAllocated: mostAllocatedWithDetails,
  });
});

// ─── GET /api/reports/export ─────────────────────────
const exportReport = asyncHandler(async (req, res) => {
  const { type = "assets" } = req.query;

  let data;
  let headers;

  switch (type) {
    case "assets":
      data = await prisma.asset.findMany({
        include: {
          category: { select: { name: true } },
          department: { select: { name: true } },
        },
        orderBy: { assetTag: "asc" },
      });
      headers = "Asset Tag,Asset Name,Serial Number,Status,Category,Department,Location,Purchase Date,Purchase Price\n";
      const assetCsv = headers + data.map((a) =>
        `"${a.assetTag}","${a.assetName}","${a.serialNumber || ""}","${a.status}","${a.category.name}","${a.department.name}","${a.location || ""}","${a.purchaseDate ? a.purchaseDate.toISOString().split("T")[0] : ""}","${a.purchasePrice || ""}"`
      ).join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=assets_report.csv");
      return res.send(assetCsv);

    case "allocations":
      data = await prisma.allocation.findMany({
        include: {
          asset: { select: { assetTag: true, assetName: true } },
          employee: { select: { name: true, email: true } },
        },
        orderBy: { allocatedDate: "desc" },
      });
      headers = "Asset Tag,Asset Name,Employee,Email,Status,Allocated Date,Returned Date\n";
      const allocationCsv = headers + data.map((a) =>
        `"${a.asset.assetTag}","${a.asset.assetName}","${a.employee.name}","${a.employee.email}","${a.status}","${a.allocatedDate.toISOString().split("T")[0]}","${a.returnedDate ? a.returnedDate.toISOString().split("T")[0] : ""}"`
      ).join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=allocations_report.csv");
      return res.send(allocationCsv);

    default:
      return res.status(400).json({ success: false, message: "Invalid report type. Use: assets, allocations" });
  }
});

module.exports = { getDashboard, getUtilization, exportReport };
