// ─── Auth Controller ─────────────────────────────────
const prisma = require("../config/db");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const {
  hashPassword,
  comparePassword,
  signToken,
  sendSuccess,
  excludeFields,
} = require("../utils/helpers");

// ─── POST /api/auth/register ─────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required.");
  }

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) {
    throw new ApiError(409, "Email is already registered.");
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone || null,
      role: "EMPLOYEE", // default role
    },
  });

  const token = signToken({ id: user.id, role: user.role });
  const userData = excludeFields(user, ["password"]);

  sendSuccess(res, { token, user: userData }, "Registration successful.", 201);
});

// ─── POST /api/auth/login ────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required.");
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account has been deactivated.");
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const token = signToken({ id: user.id, role: user.role });
  const userData = excludeFields(user, ["password"]);

  sendSuccess(res, { token, user: userData }, "Login successful.");
});

// ─── GET /api/auth/profile ───────────────────────────
const getProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { department: true },
  });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const userData = excludeFields(user, ["password"]);
  sendSuccess(res, { user: userData });
});

module.exports = { register, login, getProfile };
