// ─── Category Routes ─────────────────────────────────
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { createCategory, getCategories, updateCategory, deleteCategory } = require("../controllers/category.controller");

router.use(auth); // All category routes require authentication

router.post("/", authorize("ADMIN", "ASSET_MANAGER"), createCategory);
router.get("/", getCategories); // Any authenticated user can view
router.patch("/:id", authorize("ADMIN", "ASSET_MANAGER"), updateCategory);
router.delete("/:id", authorize("ADMIN"), deleteCategory);

module.exports = router;
