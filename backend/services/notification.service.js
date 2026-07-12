// ─── Notification Service ────────────────────────────
// Centralized service for creating notifications.
// Used by controllers to notify users of events.

const prisma = require("../config/db");

const createNotification = async (userId, title, message, type = "SYSTEM") => {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });
  } catch (err) {
    // Log but don't throw — notifications shouldn't break main operations
    console.error("Failed to create notification:", err.message);
    return null;
  }
};

module.exports = { createNotification };
