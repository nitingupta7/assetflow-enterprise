// ─── Notification Controller ─────────────────────────
const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/helpers");

// ─── GET /api/notifications ──────────────────────────
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;

  const where = { userId: req.user.id };
  if (unreadOnly === "true") where.isRead = false;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    }),
  ]);

  sendSuccess(res, {
    notifications,
    unreadCount,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ─── PATCH /api/notifications/read ───────────────────
const markAllAsRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });

  sendSuccess(res, {}, "All notifications marked as read.");
});

module.exports = { getNotifications, markAllAsRead };
