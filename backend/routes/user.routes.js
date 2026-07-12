// ─── User Routes ─────────────────────────────────────
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { getUsers, getUserById, updateUser, deleteUser, updateUserRole } = require("../controllers/user.controller");

router.use(auth); // All user routes require authentication

router.get("/", authorize("ADMIN"), getUsers);
router.get("/:id", authorize("ADMIN"), getUserById);
router.patch("/:id", authorize("ADMIN"), updateUser);
router.delete("/:id", authorize("ADMIN"), deleteUser);
router.patch("/:id/role", authorize("ADMIN"), updateUserRole);

module.exports = router;
